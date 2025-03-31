const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken')
dotenv.config();

const accountsTypeDefs = require('./types/typeDefsAccounts');
const accountsResolvers = require('./resolvers/resolversAccount');

const app = express();

app.use(cors({
    origin: 'http://localhost:5173', 
    // origin: 'http://localhost:5174', // Adjust as needed for your frontend
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB error:', err));


// In your backend file (e.g., server.js)
const getUserFromToken = (req) => {
    let token = req.headers.authorization || '';
    console.log("Received token header:", token);
    if (token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
    }
    console.log("Token after stripping:", token);
    let user = null;
    if (token) {
        try {
        user = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Verified user:", user);
        } catch (err) {
        console.error('JWT verification error:', err);
        }
    }
    return user;
};

const accountsServer = new ApolloServer({
    typeDefs: accountsTypeDefs,
    resolvers: accountsResolvers,
    context: async ({ req }) => {
        const user = getUserFromToken(req);
        return { user };
    },
    debug: true,
});


async function startServers() {
    await accountsServer.start();

    // Use different endpoints for accounts and comments
    app.use('/graphql/accounts', expressMiddleware(accountsServer));

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServers();
