export type Matrix2 = [
  [number, number],
  [number, number],
]

export const createIdentityMatrix2 = (): Matrix2 => ([
  [1, 0],
  [0, 1],
])

export type Matrix3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
]

export const createIdentityMatrix3 = (): Matrix3 => ([
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
])