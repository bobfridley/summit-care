// src/api/userEntity.js
import { authClient } from "@/api/authClient"

export const User = {
  me: () => authClient.getUser(),
};
