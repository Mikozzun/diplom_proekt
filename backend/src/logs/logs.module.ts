import { Module } from '@nestjs/common';
import { LogsGateway } from './logs.gateway.js';
import { LogsController } from './logs.controller.js';

@Module({
  controllers: [LogsController],
  providers: [LogsGateway],
  exports: [LogsGateway],
})
export class LogsModule {}
