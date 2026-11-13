export type ChannelType =
  | 'phone'
  | 'email'
  | 'post'
  | 'digital'
  | 'inPerson'
  | 'videoCall'
  | 'messaging'
  | 'kiosk';

/** One way of reaching the issuing org. Says how a step can be done, never where: no address, number or URL. */
export interface Channel {
  /** Unique within the policy; shares one namespace with evidences, facts and details. */
  name: string;
  channelType?: ChannelType;
  /** Which of the org's channels of that type, when it matters. */
  purpose?: string;
  /** Is this channel open to this applicant? */
  includeIf?: string;
}
