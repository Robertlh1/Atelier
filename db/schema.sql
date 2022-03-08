DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS answers_photos CASCADE;

CREATE TABLE questions(
id SERIAL PRIMARY KEY,
product_id INT,
body VARCHAR (1000),
date_written VARCHAR(24),
asker_name VARCHAR(60),
asker_email VARCHAR(60),
reported BOOLEAN,
helpful INT
);

COPY questions(id, product_id, body, date_written, asker_name, asker_email, reported, helpful)
FROM '/home/ubuntu/sdc/db/csv/questions.csv'
DELIMITER ','
HEADER CSV;

UPDATE questions SET date_written = null;

CREATE TABLE answers(
id SERIAL PRIMARY KEY,
question_id INT,
body VARCHAR (1000),
date_written VARCHAR(24),
answerer_name VARCHAR(60),
answerer_email VARCHAR(60),
reported BOOLEAN,
helpful INT,
CONSTRAINT fk_question
  FOREIGN KEY(question_id)
    REFERENCES questions(id)
);

COPY answers(id, question_id, body, date_written, answerer_name, answerer_email, reported, helpful)
FROM '/home/ubuntu/sdc/db/csv/answers.csv'
DELIMITER ','
HEADER CSV;

UPDATE answers SET date_written = null;

CREATE TABLE answers_photos(
id SERIAL PRIMARY KEY,
answer_id INT,
url VARCHAR (200),
CONSTRAINT fk_answer
  FOREIGN KEY(answer_id)
    REFERENCES answers(id)
);

COPY answers_photos(id, answer_id, url)
FROM '/home/ubuntu/sdc/db/csv/answers_photos.csv'
DELIMITER ','
HEADER CSV;

CREATE TABLE tempquestions(
id SERIAL PRIMARY KEY,
product_id INT,
body VARCHAR (1000),
date_written VARCHAR(24),
asker_name VARCHAR(60),
asker_email VARCHAR(60),
reported BOOLEAN,
helpful INT,
CONSTRAINT fk_product
  FOREIGN KEY(product_id)
    REFERENCES products(id)
);

COPY tempquestions(id, product_id, body, date_written, asker_name, asker_email, reported, helpful)
FROM '/home/ubuntu/sdc/db/csv/questions.csv'
DELIMITER ','
HEADER CSV;

UPDATE questions
SET date_written = TO_TIMESTAMP(tempquestions.date_written:: double precision / 1000)::timestamp with time zone at time zone 'Etc/UTC'
FROM tempquestions
WHERE questions.id = tempquestions.id;

DROP TABLE tempquestions;

UPDATE questions
SET date_written = REPLACE(date_written, ' ', 'T');

UPDATE questions
SET date_written = CONCAT(date_written, 'Z');

CREATE TABLE tempanswers(
id SERIAL PRIMARY KEY,
question_id INT,
body VARCHAR (1000),
date_written VARCHAR(24),
answerer_name VARCHAR(60),
answerer_email VARCHAR(60),
reported BOOLEAN,
helpful INT,
CONSTRAINT fk_question
  FOREIGN KEY(question_id)
    REFERENCES questions(id)
);

COPY tempanswers(id, question_id, body, date_written, answerer_name, answerer_email, reported, helpful)
FROM '/home/ubuntu/sdc/db/csv/answers.csv'
DELIMITER ','
HEADER CSV;

UPDATE answers
SET date_written = TO_TIMESTAMP(tempanswers.date_written:: double precision / 1000)::timestamp with time zone at time zone 'Etc/UTC'
FROM tempanswers
WHERE answers.id = tempanswers.id;

DROP TABLE tempanswers;

UPDATE answers
SET date_written = REPLACE(date_written, ' ', 'T');

UPDATE answers
SET date_written = CONCAT(date_written, 'Z');