import { proposalContract } from "./contracts/proposal";
import { engagementContract } from "./contracts/engagement";
import { couplesContract } from "./contracts/couples";
import { familyContract } from "./contracts/family";
import { portraitContract } from "./contracts/portrait";
import { businessContract } from "./contracts/business";
import { realEstateContract } from "./contracts/real-estate";
import { automotiveContract } from "./contracts/automotive";
import { eventsContract } from "./contracts/events";
import { weddingContract } from "./contracts/wedding";

export const CONTRACTS = {
  proposal: proposalContract,
  engagement: engagementContract,
  couples: couplesContract,
  family: familyContract,
  portrait: portraitContract,
  business: businessContract,
  "real-estate": realEstateContract,
  automotive: automotiveContract,
  events: eventsContract,
  wedding: weddingContract,
};

export type ContractType = keyof typeof CONTRACTS;
