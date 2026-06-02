import { BASE_CONTRACT } from "./contracts/base";
import { CONTRACTS, ContractType } from "./contracts";

export function buildContract(contractType: ContractType) {
  const selectedContract = CONTRACTS[contractType];

  return {
    title: selectedContract.title,
    body: `
${BASE_CONTRACT}

${selectedContract.clause}
`,
  };
}
