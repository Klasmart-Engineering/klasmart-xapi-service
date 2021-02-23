import express from "express"
import {ApolloServer} from "apollo-server-express"
import {checkToken, JWT} from "./auth"
import { register, collectDefaultMetrics } from "prom-client"
import { loadTypedefsSync } from "@graphql-tools/load"
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader"
import { Model } from "./model"

collectDefaultMetrics({})

export interface Context {
    roomId?: string,
    sessionId?: string,
    token?: JWT
}

export const connectionCount = new Map<string, number>()

async function main() {
    const model = new Model();
    const server = new ApolloServer({
        typeDefs: loadTypedefsSync('./schema.graphql', {
            loaders: [new GraphQLFileLoader()],
        })[0].document,
        resolvers: {
            Query: {
                ready: () => true,
            },
            Mutation: {
                sendEvents: (_parent, {xAPIEvents}, context: Context) => model.sendEvents(context, xAPIEvents),
            },
        },
        context: async ({req, connection}) => {
            if (connection) {
                return connection.context;
            }
            //const token = await checkToken(req.headers.authorization)
            return {}
        }
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
    
    const port = process.env.PORT || 8080
    app.listen(port, () =>
        console.log(
            `🌎 Server ready at http://localhost:${port}${server.graphqlPath}`
        )
    )
}

main().catch(e => {
    console.error(e)
    process.exit(-1)
})