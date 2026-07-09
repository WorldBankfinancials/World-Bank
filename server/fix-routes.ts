import type { User } from '@shared/schema';
import { generateAccountNumber, generateTransferPin, generateTransactionId, generateReferenceNumber } from './crypto-utils';
import { validateId, validateAmount } from './validators';
import { Express, Request, Response, NextFunction } from 'express';
import { Server, createServer } from 'http';
import { storage } from './storage-factory';
import { setupTransferRoutes } from './routes-transfer';
import { config, logConfiguration } from './config';
