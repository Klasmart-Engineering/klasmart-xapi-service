import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { AWSError, Request } from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { PromiseResult } from 'aws-sdk/lib/request'

export class DynamoDbResponseBuilder {
  private unprocessedItems?: DocumentClient.BatchWriteItemRequestMap

  public withUnprocessedItems(
    value?: DocumentClient.BatchWriteItemRequestMap,
  ): this {
    this.unprocessedItems = value
    return this
  }

  public build(): Request<DocumentClient.BatchWriteItemOutput, AWSError> {
    const request =
      Substitute.for<Request<DocumentClient.BatchWriteItemOutput, AWSError>>()
    const promiseResult: PromiseResult<
      DocumentClient.BatchWriteItemOutput,
      AWSError
    > = {
      $response: Arg.any(),
      UnprocessedItems: this.unprocessedItems,
    }
    request.promise().resolves(promiseResult)
    return request
  }
}
