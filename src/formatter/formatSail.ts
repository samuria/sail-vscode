import { SailFormatter } from './sailFormatter';

export function formatSail(expression: string): string {
  return new SailFormatter(expression).format();
}