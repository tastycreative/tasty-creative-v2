/**
 * OnlyFans Account Configuration
 * Maps combined model format (e.g., "AUTUMN_FREE") to account IDs
 */

export interface AccountConfig {
  combinedModel: string; // e.g., "AUTUMN_FREE", "AUTUMN_PAID", etc.
  accountId: string;
  displayName: string;
}

// Account configuration array
export const ONLYFANS_ACCOUNTS: AccountConfig[] = [
  {
    combinedModel: "AUTUMN_FREE",
    accountId: "acct_0a4c116d5a104a37a8526087c68d4e61",
    displayName: "Autumn (Free)",
  },
  // Add more accounts here as needed:
  // {
  //   combinedModel: "AUTUMN_PAID",
  //   accountId: "acct_xxx...",
  //   displayName: "Autumn (Premium)",
  // },
  // {
  //   combinedModel: "SPRING_FREE",
  //   accountId: "acct_yyy...",
  //   displayName: "Spring (Free)",
  // },
];

/**
 * Get account ID based on combined model format (e.g., "AUTUMN_FREE")
 */
export const getAccountId = (combinedModel: string): string | null => {
  const account = ONLYFANS_ACCOUNTS.find(
    (acc) => acc.combinedModel === combinedModel
  );

  if (!account) {
    console.warn(`No account found for ${combinedModel}`);
    return null;
  }

  return account.accountId;
};

/**
 * Get all available models
 */
export const getAvailableModels = (): {
  combinedModel: string;
  displayName: string;
}[] => {
  return ONLYFANS_ACCOUNTS.map(({ combinedModel, displayName }) => ({
    combinedModel,
    displayName,
  }));
};

/**
 * Get account configuration by combined model
 */
export const getAccountConfig = (
  combinedModel: string
): AccountConfig | undefined => {
  return ONLYFANS_ACCOUNTS.find((acc) => acc.combinedModel === combinedModel);
};
