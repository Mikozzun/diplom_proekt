"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPollResults = exports.respondToPoll = exports.createPoll = void 0;
const database_1 = require("../config/database");
const createPoll = async (postId, question, options) => {
    return database_1.prisma.poll.create({
        data: { postId, question, options },
    });
};
exports.createPoll = createPoll;
const respondToPoll = async (pollId, userId, selectedOption) => {
    const poll = await database_1.prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll)
        throw new Error('Poll not found');
    const options = poll.options;
    if (!options.includes(selectedOption))
        throw new Error('Invalid option');
    return database_1.prisma.pollResponse.upsert({
        where: { pollId_userId: { pollId, userId } },
        update: { selectedOption },
        create: { pollId, userId, selectedOption },
    });
};
exports.respondToPoll = respondToPoll;
const getPollResults = async (pollId) => {
    const poll = await database_1.prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll)
        throw new Error('Poll not found');
    const responses = await database_1.prisma.pollResponse.groupBy({
        by: ['selectedOption'],
        where: { pollId },
        _count: { selectedOption: true },
    });
    const totalVotes = responses.reduce((sum, r) => sum + r._count.selectedOption, 0);
    return {
        poll,
        results: responses.map((r) => ({
            option: r.selectedOption,
            votes: r._count.selectedOption,
            percentage: totalVotes > 0
                ? Math.round((r._count.selectedOption / totalVotes) * 100)
                : 0,
        })),
        totalVotes,
    };
};
exports.getPollResults = getPollResults;
//# sourceMappingURL=poll.service.js.map