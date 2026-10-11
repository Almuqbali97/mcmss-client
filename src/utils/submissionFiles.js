export const isUploadedFile = (file) => !!file && typeof file === 'object' && typeof file.path === 'string' && !!file.path;

// localStorage cannot store file bytes. Discard old metadata placeholders on restore.
export function restoreSubmissionFiles(data) {
  let missingFiles = false;
  const visit = (value) => {
    if (Array.isArray(value)) return value.filter((item) => {
      if (item?._fileMeta && !isUploadedFile(item)) {
        missingFiles = true;
        return false;
      }
      return true;
    }).map(visit);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, visit(item)]));
    }
    return value;
  };
  return { data: visit(data), missingFiles };
}
