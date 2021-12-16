import AWS from 'aws-sdk'
import { throwExpression } from '../../../src/helpers/throwExpression'

const endpoint =
  process.env.LOCALSTACK_ENDPOINT ??
  throwExpression('LOCALSTACK_ENDPOINT is undefined')
export const bucketName = 's3-firehose'

export async function prepareLocalstackServices(): Promise<void> {
  await createDynamoDbTable()
  await setUpFirehose()
}

async function createDynamoDbTable() {
  if (!process.env.DYNAMODB_TABLE_NAME) {
    return
  }
  const dynamodb = new AWS.DynamoDB({
    endpoint,
  })

  const params = {
    TableName: process.env.DYNAMODB_TABLE_NAME,
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'serverTimestamp', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'serverTimestamp', AttributeType: 'N' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  }

  try {
    await dynamodb.createTable(params).promise()
  } catch (e: any) {
    if (e.code !== 'ResourceInUseException') {
      throw e
    }
  }
}

async function setUpFirehose() {
  if (!process.env.FIREHOSE_STREAM_NAME) {
    return
  }
  const iam = new AWS.IAM({
    endpoint,
  })
  const s3 = new AWS.S3({
    s3ForcePathStyle: true,
    endpoint,
  })
  const firehose = new AWS.Firehose({
    endpoint,
  })

  const listRolesResult = await iam.listRoles({}).promise()
  let role = listRolesResult.Roles.find((x) => x.RoleName === 'test-role')
  if (!role) {
    const createRoleReponse = await iam
      .createRole({
        RoleName: 'test-role',
        AssumeRolePolicyDocument: assumeRolePolicyDocument,
      })
      .promise()
    role = createRoleReponse.Role
  }

  const bucketListResult = await s3.listBuckets().promise()
  const buckets = (bucketListResult.Buckets ?? []).map((x) => x.Name)
  if (!buckets.includes(bucketName)) {
    try {
      await s3.createBucket({ Bucket: bucketName }).promise()
    } catch (e) {
      console.log(e)
    }
  }

  const streamListResult = await firehose.listDeliveryStreams().promise()
  if (
    !streamListResult.DeliveryStreamNames.includes(
      process.env.FIREHOSE_STREAM_NAME,
    )
  ) {
    await firehose
      .createDeliveryStream({
        DeliveryStreamName: process.env.FIREHOSE_STREAM_NAME,
        ExtendedS3DestinationConfiguration: {
          BucketARN: `arn:aws:s3:::${bucketName}`,
          RoleARN: role.Arn,
        },
      })
      .promise()
  }
}

export async function clearDynamoDbTable(): Promise<void> {
  if (!process.env.DYNAMODB_TABLE_NAME) {
    return
  }
  const dynamodb = new AWS.DynamoDB({
    endpoint,
  })

  try {
    const allItems = await dynamodb
      .scan({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        ProjectionExpression: 'userId,serverTimestamp',
      })
      .promise()
    const itemsToDelete = allItems.Items ?? []
    for (const x of itemsToDelete) {
      await dynamodb
        .deleteItem({
          TableName: process.env.DYNAMODB_TABLE_NAME,
          Key: { userId: x.userId, serverTimestamp: x.serverTimestamp },
        })
        .promise()
    }
  } catch (e: any) {
    if (e.code !== 'ResourceInUseException') {
      throw e
    }
  }
}

export async function clearS3Bucket(bucket: string): Promise<void> {
  const s3 = new AWS.S3({
    s3ForcePathStyle: true,
    endpoint,
  })
  const objectList = await s3
    .listObjectsV2({
      Bucket: bucket,
    })
    .promise()
  if (!objectList.Contents || objectList.Contents.length == 0) {
    return
  }
  const objectsToDelete = objectList.Contents.map((x) => x.Key)
    .filter(removeNulls)
    .map((x) => {
      return { Key: x }
    })
  await s3
    .deleteObjects({
      Bucket: bucket,
      Delete: {
        Objects: objectsToDelete,
      },
    })
    .promise()
}

const removeNulls = <S>(value: S | undefined): value is S => value != null

const assumeRolePolicyDocument = `
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "firehose.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}`
