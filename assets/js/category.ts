export interface Iso<A, B> {
  to: (value: A) => B,
  from: (value: B) => A
}

export interface Monoid<A> extends Semigroup<A> {
  empty: A
}

export interface Semigroup<A> {
  concat: (a: A, b: A) => A
}
