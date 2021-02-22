import {hostname} from "os"
import {createLogger, format, transports} from "winston"
import { createServer } from "http"
import express from "express"
import {ApolloServer} from "apollo-server-express"
import {schema} from "./schema"
import {checkToken, JWT} from "./auth"
// @ts-ignore
import {setDockerId, setGraphQLConnections, setClusterId, reportConferenceStats} from "./reporting"
import { register, collectDefaultMetrics, Gauge } from "prom-client"

collectDefaultMetrics({})

const logFormat = format.printf(({level, message, label, timestamp}) => {
    return `${timestamp} [${level}]: ${message} service: ${label}`
})

export const Logger = createLogger(
    {
        level: 'info',
        format: format.combine(
            format.colorize(),
            format.timestamp(),
            format.label({label: 'default'}),
            logFormat
        ),
        defaultMeta: {service: 'default'},
        transports: [
            new transports.Console(
                {
                    level: 'info',
                }
            ),
            new transports.File(
                {
                    level: 'info',
                    filename: `logs/sfu_${
                        new Date().toLocaleDateString("en", {
                            year: "numeric",
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit"
                        })
                            .replace(/,/g, "")
                            .replace(/\//g, "-")
                            .replace(/ /g, "_")
                    }.log`
                }
            )
        ]
    }
)

export interface Context {
    roomId?: string,
    sessionId?: string,
    token?: JWT
}

export const connectionCount = new Map<string, number>()

async function main() {
    let connectionCount = 0

    const server = new ApolloServer({
        typeDefs: schema,
        subscriptions: {
            keepAlive: 1000,
            onConnect: async ({roomId, sessionId, authToken}: any, _webSocket, connectionData: any) => {
                const token = await checkToken(authToken);
                connectionCount++
                setGraphQLConnections(connectionCount)
                stopServerTimeout()
                Logger.info(`Connection(${connectionCount}) from ${sessionId}`)
                connectionData.counted = true
                connectionData.sessionId = sessionId;
                connectionData.roomId = roomId;
                return {roomId, sessionId, token} as Context;
            },
            onDisconnect: (websocket, connectionData) => {
                if (!(connectionData as any).counted) {
                    return
                }
                connectionCount--
                setGraphQLConnections(connectionCount)
                if (connectionCount <= 0) {
                    startServerTimeout(sfu)
                }
                const {sessionId} = connectionData as any
                Logger.info(`Disconnection(${connectionCount}) from ${sessionId}`)
                sfu.disconnect(sessionId)
            }
        },
        resolvers: {
            Query: {
                ready: () => true,
            },
            Mutation: {
                // rtpCapabilities: (_parent, {rtpCapabilities}, context: Context) => sfu.rtpCapabilitiesMessage(context, rtpCapabilities),
                // transport: (_parent, {producer, params}, context: Context) => sfu.transportMessage(context, producer, params),
                // producer: (_parent, {params}, context: Context) => sfu.producerMessage(context, params),
                // consumer: (_parent, {id, pause}, context: Context) => sfu.consumerMessage(context, id, pause),
                // stream: (_parent, {id, producerIds}, context: Context) => sfu.streamMessage(context, id, producerIds),
                // close: (_parent, {id}, context: Context) => sfu.closeMessage(context, id),
                // mute: (_parent, muteNotification: MuteNotification, context: Context) => sfu.muteMessage(context, muteNotification),
                // endClass: (_parent, {roomId}, context: Context) => sfu.endClassMessage(context, roomId)
            },
            Subscription: {
                media: {
                    //subscribe: (_parent, {}, context: Context) => sfu.subscribe(context)
                },
            }
        },
        context: async ({req, connection}) => {
            if (connection) {
                return connection.context;
            }
            const token = await checkToken(req.headers.authorization)
            return {}
        }
    });

    new Gauge({
        name: 'sfuCount',
        help: 'Number of SFUs currently connected to the same redis db (shard?)',
        labelNames: ["type"],
        async collect() {
            try {
                const {
                    availableCount,
                    otherCount,
                } = await sfu.sfuStats()
                this.labels("available").set(availableCount);
                this.labels("unavailable").set(otherCount);
                this.labels("total").set(availableCount+otherCount);
            } catch(e) {
                this.labels("available").set(-1);
                this.labels("unavailable").set(-1);
                this.labels("total").set(-1);
                console.log(e)
            }
        },
    });

    const app = express();
    app.get('/metrics', async (_req, res) => {
        try {
            res.set('Content-Type', register.contentType);
            const metrics = await register.metrics()
            res.end(metrics);
        } catch (ex) {
            console.error(ex)
            res.status(500).end(ex.toString());
        }
    });
    server.applyMiddleware({app})
    const httpServer = createServer(app)
    server.installSubscriptionHandlers(httpServer)

    httpServer.listen({port: process.env.PORT}, () => { Logger.info(`🌎 Server available`); })
    const address = httpServer.address()
    if(!address || typeof address === "string") { throw new Error("Unexpected address format") }

    const host = process.env.USE_IP ? ip : (process.env.HOSTNAME_OVERRIDE || hostname())
    const uri = `${host}:${address.port}${server.subscriptionsPath}`
    console.log(`Announcing address for webRTC signaling: ${uri}`)
    await sfu.claimRoom(uri)
}

let timeout: NodeJS.Timeout | undefined

export function startServerTimeout(sfu: SFU) {
    if (timeout) {
        clearTimeout(timeout)
    }
    let serverTimeoutEnvVar = parseInt(process.env.SERVER_TIMEOUT !== undefined ? process.env.SERVER_TIMEOUT : '')
    let serverTimeout = !isNaN(serverTimeoutEnvVar) ? serverTimeoutEnvVar : 5
    timeout = setTimeout(() => {
        Logger.error(`There have been no new connections after ${serverTimeout} minutes, shutting down`)
        sfu.shutdown().catch(e => Logger.error(e))
    }, 1000 * 60 * serverTimeout)
}

function stopServerTimeout() {
    if (timeout) {
        clearTimeout(timeout)
        timeout = undefined
    }
}

main().catch(e => {
    Logger.error(e)
    process.exit(-1)
})