/**
 * Bug Condition Exploration Test - Turbopack Panic Fix
 * 
 * **Validates: Requirements 2.1, 2.2, 2.4**
 * 
 * This test explores the bug condition where Turbopack panics with 
 * "Failed to write app endpoint" after successful route compilation.
 * 
 * **CRITICAL**: This test is EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists and helps identify the root cause.
 * 
 * Bug Condition (from design):
 * - input.phase == 'post-compilation'
 * - input.routeType == 'app-endpoint'
 * - input.compilationStatus == 'success'
 * - input.writeOperation == 'endpoint-metadata'
 * - writeOperationFailed(input.targetPath)
 * 
 * Expected Behavior (after fix):
 * - Server SHALL either complete write operation successfully OR
 * - Gracefully handle write failure without crashing
 * - Development server SHALL remain operational after route compilation
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import * as fc from 'fast-check';

describe('Property 1: Fault Condition - Turbopack Endpoint Write Resilience', () => {
  let devServer: ChildProcess | null = null;
  let serverOutput: string[] = [];
  let serverError: string[] = [];
  const DEV_SERVER_PORT = 3000;
  const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;
  const SERVER_STARTUP_TIMEOUT = 60000; // 60 seconds

  /**
   * Start the Next.js development server and wait for it to be ready
   */
  async function startDevServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Starting Next.js dev server...');
      
      devServer = spawn('npm', ['run', 'dev'], {
        cwd: process.cwd(),
        env: { ...process.env, PORT: String(DEV_SERVER_PORT) },
        shell: true,
      });

      let startupTimeout: NodeJS.Timeout;
      let isReady = false;

      devServer.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        serverOutput.push(output);
        console.log('[DEV SERVER]', output);

        // Check for server ready indicators
        if (output.includes('Ready in') || 
            output.includes('Local:') || 
            output.includes(`http://localhost:${DEV_SERVER_PORT}`)) {
          if (!isReady) {
            isReady = true;
            clearTimeout(startupTimeout);
            console.log('Dev server is ready!');
            // Give it a moment to fully stabilize
            setTimeout(resolve, 2000);
          }
        }
      });

      devServer.stderr?.on('data', (data: Buffer) => {
        const error = data.toString();
        serverError.push(error);
        console.error('[DEV SERVER ERROR]', error);
      });

      devServer.on('error', (error) => {
        console.error('Failed to start dev server:', error);
        reject(error);
      });

      devServer.on('exit', (code, signal) => {
        console.log(`Dev server exited with code ${code}, signal ${signal}`);
        if (!isReady) {
          reject(new Error(`Dev server exited prematurely with code ${code}`));
        }
      });

      // Timeout if server doesn't start
      startupTimeout = setTimeout(() => {
        if (!isReady) {
          reject(new Error('Dev server failed to start within timeout'));
        }
      }, SERVER_STARTUP_TIMEOUT);
    });
  }

  /**
   * Stop the development server
   */
  async function stopDevServer(): Promise<void> {
    return new Promise((resolve) => {
      if (devServer) {
        console.log('Stopping dev server...');
        devServer.kill('SIGTERM');
        
        // Force kill after 5 seconds if not stopped
        const forceKillTimeout = setTimeout(() => {
          if (devServer) {
            console.log('Force killing dev server...');
            devServer.kill('SIGKILL');
          }
        }, 5000);

        devServer.on('exit', () => {
          clearTimeout(forceKillTimeout);
          devServer = null;
          console.log('Dev server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Navigate to a route and check if server remains stable
   */
  async function navigateToRoute(route: string): Promise<{
    success: boolean;
    statusCode?: number;
    error?: string;
    serverCrashed: boolean;
  }> {
    console.log(`Navigating to ${route}...`);
    
    try {
      const response = await fetch(`${DEV_SERVER_URL}${route}`, {
        method: 'GET',
        headers: { 'Accept': 'text/html' },
      });

      console.log(`Response from ${route}: ${response.status}`);

      // Wait a moment for Turbopack to attempt endpoint metadata write
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if server is still alive
      const serverCrashed = devServer === null || devServer.killed;

      // Check for panic in error output
      const hasPanicError = serverError.some(err => 
        err.includes('Failed to write app endpoint') ||
        err.includes('panic') ||
        err.includes('FATAL')
      );

      return {
        success: response.ok,
        statusCode: response.status,
        serverCrashed: serverCrashed || hasPanicError,
      };
    } catch (error) {
      console.error(`Error navigating to ${route}:`, error);
      
      const serverCrashed = devServer === null || devServer.killed;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        serverCrashed,
      };
    }
  }

  /**
   * Check if the bug condition is present in the logs
   */
  function checkForBugCondition(): {
    bugDetected: boolean;
    errorMessage?: string;
    details: string[];
  } {
    const details: string[] = [];
    let bugDetected = false;
    let errorMessage: string | undefined;

    // Check for the specific error message
    for (const error of serverError) {
      if (error.includes('Failed to write app endpoint')) {
        bugDetected = true;
        errorMessage = error.trim();
        details.push(`Found error: ${error.trim()}`);
      }
      if (error.includes('panic')) {
        details.push(`Panic detected: ${error.trim()}`);
      }
    }

    // Check if server crashed
    if (devServer === null || devServer.killed) {
      details.push('Server process terminated unexpectedly');
    }

    return { bugDetected, errorMessage, details };
  }

  beforeAll(async () => {
    // Clear any previous server output
    serverOutput = [];
    serverError = [];
    
    // Start the dev server
    await startDevServer();
  }, SERVER_STARTUP_TIMEOUT + 5000);

  afterAll(async () => {
    await stopDevServer();
  }, 10000);

  test('EXPLORATION: Server remains stable when navigating to / (home page)', async () => {
    const result = await navigateToRoute('/');
    
    console.log('Navigation result:', result);
    
    // Document the behavior
    const bugCheck = checkForBugCondition();
    console.log('Bug condition check:', bugCheck);

    // Expected behavior: Server should remain stable
    // On UNFIXED code: This assertion will FAIL (which is correct - proves bug exists)
    // On FIXED code: This assertion will PASS (confirms fix works)
    expect(result.serverCrashed).toBe(false);
    
    // Additional assertion: Route should compile successfully
    expect(result.success || result.statusCode === 200).toBe(true);
  }, 30000);

  test('EXPLORATION: Server remains stable when navigating to /feed', async () => {
    const result = await navigateToRoute('/feed');
    
    console.log('Navigation result:', result);
    
    const bugCheck = checkForBugCondition();
    console.log('Bug condition check:', bugCheck);

    // Expected behavior: Server should remain stable
    expect(result.serverCrashed).toBe(false);
  }, 30000);

  test('EXPLORATION: Server remains stable when navigating to /login', async () => {
    const result = await navigateToRoute('/login');
    
    console.log('Navigation result:', result);
    
    const bugCheck = checkForBugCondition();
    console.log('Bug condition check:', bugCheck);

    // Expected behavior: Server should remain stable
    expect(result.serverCrashed).toBe(false);
  }, 30000);

  test('PROPERTY: Server stability across multiple route navigations', async () => {
    // Property-based test: For ANY route that triggers endpoint metadata write,
    // the server SHALL remain operational
    
    // Scoped to concrete failing cases for deterministic reproduction
    const knownRoutes = ['/', '/feed', '/login'];
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...knownRoutes),
        async (route) => {
          const result = await navigateToRoute(route);
          
          // Property: Server must not crash after route compilation
          // This encodes the expected behavior from the design
          return !result.serverCrashed;
        }
      ),
      {
        numRuns: 3, // Test each route once (deterministic bug)
        verbose: true,
      }
    );
  }, 90000);
});

/**
 * COUNTEREXAMPLE DOCUMENTATION
 * 
 * When this test FAILS on unfixed code, document the following:
 * 
 * 1. Exact error message from Turbopack
 * 2. .next/ directory structure and permissions
 * 3. Turbopack logs for detailed error information
 * 4. Whether rapid navigation affects the bug
 * 5. Whether fresh cache (deleted .next/) affects the bug
 * 6. Whether filesystem permissions (777) affect the bug
 * 7. Whether minimal config (no PWA, no outputFileTracingRoot) affects the bug
 * 
 * This information will guide the root cause analysis and fix implementation.
 */
