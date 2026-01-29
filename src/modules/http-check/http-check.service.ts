import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { HttpCheckConfig, HttpCheckResult } from './interfaces/http-check.interface';

@Injectable()
export class HttpCheckService {
  private readonly logger = new Logger(HttpCheckService.name);

  async performCheck(config: HttpCheckConfig): Promise<HttpCheckResult> {
    const startTime = Date.now();
    const timeoutMs = config.timeoutMs || 30000; // Default 30 seconds

    const axiosConfig: AxiosRequestConfig = {
      url: config.url,
      method: config.method || 'GET',
      headers: config.headers || {},
      data: config.body,
      timeout: timeoutMs,
      maxRedirects: config.followRedirects !== false ? 5 : 0,
      httpsAgent: config.validateSSL === false ? { rejectUnauthorized: false } : undefined,
      validateStatus: () => true, // Don't throw on any status code
    };

    try {
      this.logger.debug(`Performing HTTP check: ${config.method || 'GET'} ${config.url}`);
      
      const response = await axios(axiosConfig);
      const responseTime = Date.now() - startTime;
      const httpStatusCode = response.status;

      // Check status code
      const expectedStatusCodes = config.expectedStatusCodes || [200];
      const isStatusValid = expectedStatusCodes.includes(httpStatusCode);

      if (!isStatusValid) {
        return {
          status: 'down',
          responseTime,
          httpStatusCode,
          errorMessage: `Unexpected status code: ${httpStatusCode}. Expected: ${expectedStatusCodes.join(', ')}`,
          timestamp: new Date(),
        };
      }

      // Check keyword if specified
      let matchedKeyword: boolean | undefined;
      if (config.expectedKeyword) {
        const responseBody = typeof response.data === 'string' 
          ? response.data 
          : JSON.stringify(response.data);
        matchedKeyword = responseBody.includes(config.expectedKeyword);

        if (!matchedKeyword) {
          return {
            status: 'down',
            responseTime,
            httpStatusCode,
            errorMessage: `Keyword "${config.expectedKeyword}" not found in response`,
            matchedKeyword: false,
            timestamp: new Date(),
          };
        }
      }

      return {
        status: 'up',
        responseTime,
        httpStatusCode,
        matchedKeyword,
        timestamp: new Date(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        return this.handleAxiosError(axiosError, responseTime);
      }

      return {
        status: 'down',
        responseTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date(),
      };
    }
  }

  private handleAxiosError(error: AxiosError, responseTime: number): HttpCheckResult {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        status: 'down',
        responseTime,
        errorMessage: `Request timed out after ${error.config?.timeout || 30000}ms`,
        timestamp: new Date(),
      };
    }

    if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      return {
        status: 'down',
        responseTime,
        errorMessage: `DNS lookup failed for ${error.config?.url}`,
        timestamp: new Date(),
      };
    }

    if (error.code === 'ECONNREFUSED') {
      return {
        status: 'down',
        responseTime,
        errorMessage: `Connection refused to ${error.config?.url}`,
        timestamp: new Date(),
      };
    }

    if (error.response) {
      // Server responded with an error status
      return {
        status: 'down',
        responseTime,
        httpStatusCode: error.response.status,
        errorMessage: `Server returned error: ${error.response.status} ${error.response.statusText}`,
        timestamp: new Date(),
      };
    }

    return {
      status: 'down',
      responseTime,
      errorMessage: error.message || 'Network error occurred',
      timestamp: new Date(),
    };
  }
}
