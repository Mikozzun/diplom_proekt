import { prisma } from '../config/database';

export const createPoll = async (
  postId: bigint,
  question: string,
  options: string[],
) => {
  return prisma.poll.create({
    data: { postId, question, options },
  });
};

export const respondToPoll = async (
  pollId: bigint,
  userId: bigint,
  selectedOption: string,
) => {
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) throw new Error('Poll not found');

  const options = poll.options as string[];
  if (!options.includes(selectedOption)) throw new Error('Invalid option');

  return prisma.pollResponse.upsert({
    where: { pollId_userId: { pollId, userId } },
    update: { selectedOption },
    create: { pollId, userId, selectedOption },
  });
};

export const getPollResults = async (pollId: bigint) => {
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) throw new Error('Poll not found');

  const responses = await prisma.pollResponse.groupBy({
    by: ['selectedOption'],
    where: { pollId },
    _count: { selectedOption: true },
  });

  const totalVotes = responses.reduce(
    (sum, r) => sum + r._count.selectedOption,
    0,
  );

  return {
    poll,
    results: responses.map((r) => ({
      option: r.selectedOption,
      votes: r._count.selectedOption,
      percentage:
        totalVotes > 0
          ? Math.round((r._count.selectedOption / totalVotes) * 100)
          : 0,
    })),
    totalVotes,
  };
};
