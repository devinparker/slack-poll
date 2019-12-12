const faker = require('faker');

const Poll = require('../../../domain/poll');
const PollAnswer = require('../../../domain/pollAnswer');
const createTestDatabase = require('../../../../test/database');
const createPollsRepository = require('../../../../test/repositories/pollsRepository');
const createPollAnswersRepository = require('../../../../test/repositories/pollAnswersRepository');
const createCreatePollUseCase = require('../createPoll');
const createCreatePollResponseUseCase = require('../createPollResponse');

test('adds a poll response to a given poll', async () => {
  const { createPoll, createPollResponse } = await testSetup();

  const poll = Poll({
    options: [faker.lorem.word(), faker.lorem.word()],
    owner: faker.random.uuid(),
    question: faker.lorem.word(),
  });

  const createdPoll = await createPoll(poll);
  expect(createdPoll.question).toBe(poll.question);

  // Use the first option as the value of poll answer
  const [selectedPollAnswerValue] = poll.options;
  const pollAnswer = PollAnswer({
    option: selectedPollAnswerValue,
    owner: faker.random.uuid(),
    poll: createdPoll.id,
  });

  const createdPollAnswer = await createPollResponse(createdPoll, pollAnswer);
  expect(poll.options.includes(createdPollAnswer.option)).toBe(true);
  expect(createdPollAnswer.poll).toBe(createdPoll.id);
});

test('replaces response if tries to add another response to same poll', async () => {
  const {
    createPoll,
    createPollResponse,
    pollAnswersRepository,
  } = await testSetup();

  const answerOwner = faker.random.uuid();

  const poll = Poll({
    options: [faker.lorem.word(), faker.lorem.word()],
    owner: faker.random.uuid(),
    question: faker.lorem.word(),
  });

  const createdPoll = await createPoll(poll);
  expect(createdPoll.question).toBe(poll.question);

  // Use the first option as the value of poll answer
  let selectedPollAnswerValue = poll.options[0];
  const firstPollAnswer = PollAnswer({
    option: selectedPollAnswerValue,
    owner: answerOwner,
    poll: createdPoll.id,
  });

  let createdPollAnswer = await createPollResponse(
    createdPoll,
    firstPollAnswer
  );

  expect(poll.options.includes(createdPollAnswer.option)).toBe(true);
  expect(createdPollAnswer.option).toBe(selectedPollAnswerValue);
  expect(createdPollAnswer.poll).toBe(createdPoll.id);

  let allPollAnswers = await pollAnswersRepository.find({
    owner: answerOwner,
    poll: createdPoll.id,
  });

  expect(allPollAnswers.length).toBe(1);

  // Use the second options as the replacement poll answer value
  selectedPollAnswerValue = poll.options[1];
  const secondPollAnswer = PollAnswer({
    option: selectedPollAnswerValue,
    owner: answerOwner,
    poll: createdPoll.id,
  });

  createdPollAnswer = await createPollResponse(createdPoll, secondPollAnswer);
  expect(poll.options.includes(createdPollAnswer.option)).toBe(true);
  expect(createdPollAnswer.option).toBe(selectedPollAnswerValue);
  expect(createdPollAnswer.poll).toBe(createdPoll.id);

  allPollAnswers = await pollAnswersRepository.find({
    owner: answerOwner,
    poll: createdPoll.id,
  });

  expect(allPollAnswers.length).toBe(1);
});

test('delete response if tries to add another response with de same option and same poll', async () => {
  const {
    createPoll,
    createPollResponse,
    pollAnswersRepository,
  } = await testSetup();

  const answerOwner = faker.random.uuid();

  const poll = Poll({
    options: [faker.lorem.word(), faker.lorem.word()],
    owner: faker.random.uuid(),
    question: faker.lorem.word(),
  });

  const createdPoll = await createPoll(poll);
  expect(createdPoll.question).toBe(poll.question);

  // Use the first option as the value of poll answer
  let selectedPollAnswerValue = poll.options[0];
  const firstPollAnswer = PollAnswer({
    option: selectedPollAnswerValue,
    owner: answerOwner,
    poll: createdPoll.id,
  });

  let createdPollAnswer = await createPollResponse(
    createdPoll,
    firstPollAnswer
  );

  expect(poll.options.includes(createdPollAnswer.option)).toBe(true);
  expect(createdPollAnswer.option).toBe(selectedPollAnswerValue);
  expect(createdPollAnswer.poll).toBe(createdPoll.id);

  let allPollAnswers = await pollAnswersRepository.find({
    owner: answerOwner,
    poll: createdPoll.id,
  });

  expect(allPollAnswers.length).toBe(1);

  // Keep the same option in selectedPollAnswerValue
  const secondPollAnswer = PollAnswer({
    option: selectedPollAnswerValue,
    owner: answerOwner,
    poll: createdPoll.id,
  });

  createdPollAnswer = await createPollResponse(createdPoll, secondPollAnswer);
  expect(poll.options.includes(createdPollAnswer.option)).toBe(true);
  expect(createdPollAnswer.option).toBe(selectedPollAnswerValue);
  expect(createdPollAnswer.poll).toBe(createdPoll.id);

  allPollAnswers = await pollAnswersRepository.find({
    owner: answerOwner,
    poll: createdPoll.id,
  });

  expect(allPollAnswers.length).toBe(0);
});

test('adds two poll responses to a given poll', async () => {
  const {
    createPoll,
    createPollResponse,
    pollAnswersRepository,
  } = await testSetup();

  const answerOwner = faker.random.uuid();

  const poll = Poll({
    options: [faker.lorem.word(), faker.lorem.word()],
    owner: faker.random.uuid(),
    question: faker.lorem.word(),
    mode: Poll.PollMode.MULTIPLE,
  });

  const createdPoll = await createPoll(poll);
  expect(createdPoll.question).toBe(poll.question);

  let [
    firstSelectedPollAnswerValue,
    secondSelectedPollAnswerValue,
  ] = poll.options;

  const firstPollAnswer = PollAnswer({
    option: firstSelectedPollAnswerValue,
    owner: answerOwner,
    poll: createdPoll.id,
  });

  const secondPollAnswer = PollAnswer({
    option: secondSelectedPollAnswerValue,
    owner: answerOwner,
    poll: createdPoll.id,
  });

  const [firstCreatedPollAnswers, secondCreatedPollAnswers] = [
    await createPollResponse(createdPoll, firstPollAnswer),
    await createPollResponse(createdPoll, secondPollAnswer),
  ];

  expect(firstCreatedPollAnswers.option).toBe(firstSelectedPollAnswerValue);
  expect(firstCreatedPollAnswers.owner).toBe(answerOwner);
  expect(firstCreatedPollAnswers.poll).toBe(createdPoll.id);
  expect(poll.options.includes(firstCreatedPollAnswers.option)).toBe(true);
  expect(poll.options.includes(secondCreatedPollAnswers.option)).toBe(true);
  expect(secondCreatedPollAnswers.option).toBe(secondSelectedPollAnswerValue);
  expect(secondCreatedPollAnswers.owner).toBe(answerOwner);
  expect(secondCreatedPollAnswers.poll).toBe(createdPoll.id);

  const allPollAnswers = await pollAnswersRepository.find({
    owner: answerOwner,
    poll: createdPoll.id,
  });

  expect(allPollAnswers.length).toBe(2);
});

async function testSetup() {
  const sequelize = await createTestDatabase();
  const pollsRepository = createPollsRepository(sequelize);
  const pollAnswersRepository = createPollAnswersRepository(sequelize);

  const createPoll = createCreatePollUseCase(pollsRepository);
  const createPollResponse = createCreatePollResponseUseCase(
    pollAnswersRepository
  );

  return { pollAnswersRepository, createPoll, createPollResponse };
}
