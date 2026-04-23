import type { Payload } from 'payload';

declare global {
  namespace App {
    interface Locals {
      payload: Payload;
    }
    // You can also add user here if you plan to use Payload auth later
    // user: import('payload').PayloadRequest['user']
  }
}

export {};