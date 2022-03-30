import { TypedArrayConstructor } from "./types";
import { roundUpToMultiple4, roundUpToMultiple8 } from "./util";

const $cursor = Symbol("cursor");

export type CursorBuffer = ArrayBuffer & { [$cursor]: number; cursor: number };

export const createCursorBuffer = (buffer: ArrayBuffer = new ArrayBuffer(1e7 /*10MB*/)): CursorBuffer => {
  (buffer as CursorBuffer)[$cursor] = 0;
  Object.defineProperty(buffer, "cursor", {
    get() {
      return this[$cursor];
    },
  });
  return buffer as CursorBuffer;
};

export const roundCursor = <T extends TypedArrayConstructor>(buffer: CursorBuffer, type: T) => {
  const { name } = type;
  if (name.includes("32")) buffer[$cursor] = roundUpToMultiple4(buffer[$cursor]);
  if (name.includes("64")) buffer[$cursor] = roundUpToMultiple8(buffer[$cursor]);
};

export const addView = <T extends TypedArrayConstructor>(
  buffer: CursorBuffer,
  Type: T,
  size: number
): InstanceType<T> => {
  roundCursor(buffer, Type);

  const store = new Type(buffer, buffer[$cursor], size);
  buffer[$cursor] += size * store.BYTES_PER_ELEMENT;

  return store as InstanceType<T>;
};

export const addViewAoA = <T extends TypedArrayConstructor>(
  buffer: CursorBuffer,
  type: T,
  stride: number,
  size: number
): InstanceType<T>[] => {
  const store = addView<T>(buffer, type, size * stride);
  const array = Array(size);
  for (let i = 0; i < size; i++) {
    array[i] = store.subarray(i * stride, i * stride + stride);
  }
  return array;
};

export const addViewVector3 = (stackBuffer: CursorBuffer, n: number) => addViewAoA(stackBuffer, Float32Array, 3, n);
export const addViewVector4 = (stackBuffer: CursorBuffer, n: number) => addViewAoA(stackBuffer, Float32Array, 4, n);
export const addViewMatrix4 = (stackBuffer: CursorBuffer, n: number) => addViewAoA(stackBuffer, Float32Array, 16, n);
