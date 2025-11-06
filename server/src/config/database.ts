import mongoose from 'mongoose';
import { IDBOptions } from '../types';

class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('Already connected to MongoDB');
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not defined');
      }

      const options: IDBOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
      };

      await mongoose.connect(mongoUri, options);

      this.isConnected = true;
      
      console.log('✅ Connected to MongoDB successfully');
      console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
      console.log(`🌍 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);

      // Handle connection events
      this.setupEventListeners();

    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      console.log('Not connected to MongoDB');
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('📴 Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnectionInfo(): any {
    if (!this.isConnected) {
      return null;
    }

    return {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      readyState: mongoose.connection.readyState,
      collections: Object.keys(mongoose.connection.collections)
    };
  }

  // Health check method
  public async healthCheck(): Promise<{
    status: 'connected' | 'disconnected' | 'connecting' | 'error';
    database: string | null;
    host: string | null;
    uptime: number;
    collections: number;
  }> {
    try {
      const connection = mongoose.connection;
      const status = this.getReadyStateText(connection.readyState);
      
      return {
        status: status as 'connected' | 'disconnected' | 'connecting' | 'error',
        database: connection.db?.databaseName || null,
        host: connection.host || null,
        uptime: process.uptime(),
        collections: connection.db ? Object.keys(connection.collections).length : 0
      };
    } catch (error) {
      return {
        status: 'error',
        database: null,
        host: null,
        uptime: process.uptime(),
        collections: 0
      };
    }
  }

  private getReadyStateText(readyState: number): string {
    switch (readyState) {
      case 0: return 'disconnected';
      case 1: return 'connected';
      case 2: return 'connecting';
      case 3: return 'disconnecting';
      default: return 'error';
    }
  }

  // Database utility methods
public async createIndexes(): Promise<void> {
  try {
    console.log('📊 Creating database indexes...');
    
    // Get all model names
    const modelNames = mongoose.modelNames();
    
    for (const modelName of modelNames) {
      try {
        const model = mongoose.model(modelName);
        
        // Try to sync indexes first
        await model.syncIndexes();
        console.log(`✅ Indexes created for ${modelName} model`);
        
      } catch (error: any) {
        if (error.code === 86) { // IndexKeySpecsConflict
          console.log(`🔧 Fixing index conflicts for ${modelName}...`);
          
          try {
            const model = mongoose.model(modelName);
            
            // Get existing indexes
            const indexes = await model.collection.indexes();
            
            // Drop conflicting indexes (except _id)
            for (const index of indexes) {
              if (index.name !== '_id_') {
                try {
                  await model.collection.dropIndex(index.name);
                  console.log(`   Dropped conflicting index: ${index.name}`);
                } catch (dropError: any) {
                  // Index might not exist, continue
                  console.log(`   Could not drop index ${index.name}: ${dropError.message}`);
                }
              }
            }
            
            // Now recreate indexes
            await model.syncIndexes();
            console.log(`   ✅ Recreated indexes for ${modelName}`);
            
          } catch (recreateError) {
            console.warn(`   ⚠️  Could not recreate indexes for ${modelName}:`, recreateError);
          }
        } else {
          // Log other errors but continue
          console.warn(`⚠️  Index warning for ${modelName}:`, error.message);
        }
      }
    }
    
    console.log('📊 Database indexes creation completed');
  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
    // Don't throw error - continue startup
    console.log('⚠️  Continuing without index creation...');
  }
}

  public async dropDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop database in production environment');
    }

    try {
      await mongoose.connection.dropDatabase();
      console.log('🗑️ Database dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping database:', error);
      throw error;
    }
  }

  public async getCollectionStats(): Promise<any[]> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not available');
      }

      const collections = await db.listCollections().toArray();
      const stats = [];

      for (const collection of collections) {
        const collectionStats = await db.collection(collection.name).stats();
        stats.push({
          name: collection.name,
          documents: collectionStats.count || 0,
          size: collectionStats.size || 0,
          avgObjSize: collectionStats.avgObjSize || 0,
          indexes: collectionStats.nindexes || 0
        });
      }

      return stats;
    } catch (error) {
      console.error('❌ Error getting collection stats:', error);
      return [];
    }
  }

  private setupEventListeners(): void {
    // Handle successful connection
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    // Handle connection errors
    mongoose.connection.on('error', (error) => {
      console.error('❌ Mongoose connection error:', error);
      this.isConnected = false;
    });

    // Handle disconnection
    mongoose.connection.on('disconnected', () => {
      console.log('📴 Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Handle reconnection
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Mongoose reconnected to MongoDB');
      this.isConnected = true;
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      try {
        await this.disconnect();
        console.log('🛑 Application terminated, database connection closed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    });

    // Handle application termination (Windows)
    process.on('SIGTERM', async () => {
      try {
        await this.disconnect();
        console.log('🛑 Application terminated (SIGTERM), database connection closed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown (SIGTERM):', error);
        process.exit(1);
      }
    });
  }
}

// Export singleton instance
export default Database.getInstance();

// Export for dependency injection or testing
export { Database };