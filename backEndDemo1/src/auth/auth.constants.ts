export const jwtConstants = {
  secret: process.env.JWT_SECRET ?? 'codesample',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'codesample-refresh',
};