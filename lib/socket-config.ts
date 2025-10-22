export const getSocketConfig = (path: string) => {
  const baseUrl =
    process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000";

  return {
    uri: baseUrl,
    options: {
      path,
      transports: ["polling", "websocket"],
      autoConnect: true,
      reconnection: true,
    },
  };
};
