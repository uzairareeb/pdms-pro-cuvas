export default async function handler(req: any, res: any) {
  const { default: appPromise } = await import("../server.ts");
  const app = await appPromise;
  return (app as any)(req, res);
}
