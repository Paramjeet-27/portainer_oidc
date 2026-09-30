const users = {
  "test-user": {
    email: "test@example.com",
    email_verified: true,
    name: "Test User",
  },
};

export async function findAccount(ctx, id) {
  const user = users[id];
  if (!user) return undefined;

  return {
    accountId: id,
    async claims() {
      return { sub: id, ...user };
    },
  };
}
