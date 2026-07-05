import { PrismaClient } from "../generated/prisma/client.js";
export const prisma = new PrismaClient();   

// Creates and exports a single shared PrismaClient instance (singleton pattern).
// Single instance = one DB connection pool. 
// Every file imports from here instead of creating their own PrismaClient.