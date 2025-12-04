export function filterDefinedFields<T>(
  updateFields: Partial<T>,
  options?: { stripEmptyStringsFor?: Array<keyof T>; omitKeys?: Array<keyof T> },
): Partial<T> {
  const patch: Partial<T> = {};
  const defaultOmitKeys = ['id'] as unknown as Array<keyof T>;
  const omitKeys = options?.omitKeys ?? defaultOmitKeys;
  Object.keys(updateFields).forEach((key) => {
    const value = updateFields[key as keyof T];
    // Skip undefined only (allow null to pass through for unsetting fields)
    if (value === undefined) return;

    if (omitKeys.includes(key as keyof T)) {
      return;
    }

    // Optionally strip empty strings for specific keys
    if (
      options?.stripEmptyStringsFor &&
      options.stripEmptyStringsFor.includes(key as keyof T) &&
      value === ''
    ) {
      return;
    }

    patch[key as keyof T] = value;
  });
  return patch;
}
