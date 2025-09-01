/**
 * PostgreSQL Database Module
 * 
 * Provides a comprehensive database abstraction layer for the Follow-Swarm application.
 * Handles connection pooling, query execution, transactions, and common CRUD operations.
 * Uses node-postgres (pg) for efficient PostgreSQL connectivity.
 */

const { Pool } = require('pg');
const config = require('../../config');
const logger = require('../utils/logger');

/**
 * Database Class
 * 
 * Manages PostgreSQL connections and provides helper methods for database operations.
 * Implements connection pooling for optimal performance and resource management.
 */
class Database {
  constructor() {
    // PostgreSQL connection pool instance
    this.pool = null;
  }

  /**
   * Establishes connection to PostgreSQL database
   * Creates a connection pool for efficient query handling
   * @returns {Pool} The PostgreSQL connection pool
   * @throws {Error} If connection fails
   */
  async connect() {
    try {
      // Determine if we should use connection string or individual parameters
      // Check for valid connection URL (not placeholder and proper format)
      const hasValidUrl = config.database.url && 
                         !config.database.url.includes('your_') && 
                         config.database.url.startsWith('postgresql://');
      
      // Log connection details for debugging (sensitive data excluded in production)
      logger.info('Attempting database connection:', {
        host: config.database.host,
        port: config.database.port,
        database: config.database.database,
        user: config.database.user,
        hasPassword: !!config.database.password, // Boolean flag for security
        passwordType: typeof config.database.password // Debug password type issues
      });
      
      // Configure connection pool based on available credentials
      const poolConfig = hasValidUrl ? {
        connectionString: config.database.url,
        max: config.database.max, // Maximum pool size
        idleTimeoutMillis: config.database.idleTimeoutMillis, // Close idle connections
        connectionTimeoutMillis: config.database.connectionTimeoutMillis // Connection timeout
      } : {
        host: config.database.host,
        port: config.database.port,
        database: config.database.database,
        user: config.database.user,
        password: String(config.database.password || 'postgres'), // Ensure string type
        max: config.database.max,
        idleTimeoutMillis: config.database.idleTimeoutMillis,
        connectionTimeoutMillis: config.database.connectionTimeoutMillis
      };
      
      this.pool = new Pool(poolConfig);

      // Test connection by executing a simple query
      const client = await this.pool.connect();
      await client.query('SELECT NOW()'); // Verify database is responsive
      client.release(); // Return client to pool
      
      logger.info('Database connected successfully');
      return this.pool;
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Executes a SQL query with optional parameters
   * Includes timing and logging for performance monitoring
   * @param {string} text - SQL query string
   * @param {Array} params - Query parameters for prepared statements
   * @returns {Object} Query result object
   * @throws {Error} If query execution fails
   */
  async query(text, params) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      // Log query execution details for monitoring
      logger.debug('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Query error:', { text, error: error.message });
      throw error;
    }
  }

  /**
   * Gets a dedicated client from the pool for manual transaction control
   * Includes timeout monitoring to detect long-running clients
   * @returns {Client} PostgreSQL client with wrapped methods
   */
  async getClient() {
    const client = await this.pool.connect();
    // Store original methods
    const query = client.query.bind(client);
    const release = client.release.bind(client);

    // Monitor for clients held too long (potential connection leak)
    const timeout = setTimeout(() => {
      logger.error('A client has been checked out for more than 5 seconds!');
    }, 5000);

    // Wrap query method to reset timeout on activity
    client.query = (...args) => {
      clearTimeout(timeout);
      return query(...args);
    };

    // Wrap release method to clear timeout
    client.release = () => {
      clearTimeout(timeout);
      return release();
    };

    return client;
  }

  /**
   * Executes operations within a database transaction
   * Automatically handles BEGIN, COMMIT, and ROLLBACK
   * @param {Function} callback - Async function that receives client and performs operations
   * @returns {*} Result from the callback function
   * @throws {Error} If any operation in the transaction fails
   */
  async transaction(callback) {
    const client = await this.getClient();
    try {
      await client.query('BEGIN'); // Start transaction
      const result = await callback(client); // Execute operations
      await client.query('COMMIT'); // Commit on success
      return result;
    } catch (error) {
      await client.query('ROLLBACK'); // Rollback on error
      throw error;
    } finally {
      client.release(); // Always return client to pool
    }
  }

  /**
   * Closes all database connections in the pool
   * Used for graceful shutdown
   */
  async disconnect() {
    if (this.pool) {
      await this.pool.end(); // Close all pool connections
      logger.info('Database disconnected');
    }
  }

  /**
   * Helper Methods for Common Database Operations
   * Simplifies CRUD operations with consistent interface
   */

  /**
   * Finds a single record matching the conditions
   * @param {string} table - Table name
   * @param {Object} conditions - Key-value pairs for WHERE clause
   * @returns {Object|null} First matching record or null
   */
  async findOne(table, conditions) {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    // Build WHERE clause with parameterized queries for security
    const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    
    const query = `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`;
    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Finds multiple records matching the conditions
   * @param {string} table - Table name
   * @param {Object} conditions - Key-value pairs for WHERE clause
   * @param {Object} options - Query options (orderBy, limit, offset)
   * @returns {Array} Array of matching records
   */
  async findMany(table, conditions = {}, options = {}) {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    let query = `SELECT * FROM ${table}`;
    
    // Add WHERE clause if conditions provided
    if (keys.length > 0) {
      const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
      query += ` WHERE ${whereClause}`;
    }
    
    // Add sorting and pagination options
    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    }
    
    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
    }
    
    if (options.offset) {
      query += ` OFFSET ${options.offset}`;
    }
    
    const result = await this.query(query, values);
    return result.rows;
  }

  /**
   * Inserts a new record into the database
   * @param {string} table - Table name
   * @param {Object} data - Key-value pairs to insert
   * @returns {Object} Inserted record with generated fields
   */
  async insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    // Create parameterized placeholders for values
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    // Build INSERT query with RETURNING clause to get inserted record
    const query = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Updates an existing record by ID
   * @param {string} table - Table name
   * @param {*} id - Record ID
   * @param {Object} data - Key-value pairs to update
   * @returns {Object} Updated record
   */
  async update(table, id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    // Build SET clause (offset by 1 for ID parameter)
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    
    const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.query(query, [id, ...values]);
    return result.rows[0];
  }

  /**
   * Deletes a record by ID
   * @param {string} table - Table name
   * @param {*} id - Record ID
   * @returns {Object} Deleted record
   */
  async delete(table, id) {
    // Delete and return the deleted record
    const query = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;
    const result = await this.query(query, [id]);
    return result.rows[0];
  }
}

// Export singleton instance for consistent database connection
module.exports = new Database();