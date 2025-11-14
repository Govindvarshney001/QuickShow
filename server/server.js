import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express'
import {serve} from "inngest/express";
import {inngest, functions} from "./inngest/index.js"


const app=express();
const port=3000;

await connectDB()

//middleware
app.use(express.json())
app.use(cors())
// Apply Clerk middleware only when a publishable key is provided and looks valid.
const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (clerkPublishableKey && clerkPublishableKey.startsWith('pk_')) {
	app.use(clerkMiddleware())
} else {
	console.warn('Clerk publishable key not valid or missing. Skipping Clerk middleware.\nSet `CLERK_PUBLISHABLE_KEY` in server/.env (value starts with "pk_").')
}

//API Routes
app.get('/', (req,res)=> res.send('Server is Live!'))
app.use('/api/inngest',serve({ client: inngest, functions }))
app.listen(port, ()=> console.log(`Server listening at http://localhost:${port}`));

