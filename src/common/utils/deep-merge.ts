import _ from 'lodash';
import { DeepPartial } from './types';

export const deepMerge = <T extends object>(
  target: T,
  source: DeepPartial<T>,
): T => {
  return _.merge(target, source);
};
