/** Default landing route after login for each role */
export function getDefaultRouteForRole(role) {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'reviewer':
    case 'researcher':
    default:
      return '/dashboard';
  }
}
