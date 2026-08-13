/** Wraps an async route handler so a rejected promise reaches Express's error middleware. */
export function asyncHandler(fn) {
  return (req, res, next) => fn(req, res, next).catch(next)
}
