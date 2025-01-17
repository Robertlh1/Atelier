require('newrelic');
const express = require('express');
const url = require('url');
const db = require('./queries.js');
const util = require('util');

const app = express();
app.use(express.json());

app.listen(3000, () => {
  console.log('Listening on port 3000')
})

/*
========== POST Requests ==========
*/

// Route to post a new question
app.post('/api/fec2/hr-den/qa/questions', async (req, res) => {
  const params = url.parse(req.url, true).query

  db.pool.query(`INSERT INTO questions(product_id, body, date_written, asker_name, asker_email, reported, helpful)
  VALUES('${params.product_id}', '${req.body.body}', '${util.inspect(new Date())}', '${req.body.asker_name}',
  '${req.body.asker_email}', 'false', '0')`, (err, result) => {
    if (err) {
      res.send(err)
    } else {
      res.send()
    }
  })
});

// Route to post a new answer
app.post('/api/fec2/hr-den/qa/questions/*/answers', async (req, res) => {
  const question_id = req.url.replace('/api/fec2/hr-den/qa/questions/', '').replace('/answers', '')

  var id = await db.pool.query(`
  INSERT INTO answers(question_id, body, date_written, answerer_name, answerer_email, reported, helpful)
  VALUES('${question_id}', '${req.body.body}', '${util.inspect(new Date())}', '${req.body.answerer_name}',
  '${req.body.answerer_email}', 'false', '0')
  RETURNING id`)

  for (var i = 0; i < req.body.photos.length; i++) {
    await db.pool.query(`INSERT INTO answers_photos(answer_id, url)
    VALUES('${id.rows[0].id}', '${req.body.photos[i]}')`, (err, result) => {
      if (err) {
        res.send(err)
      } else {
        res.send()
      }
    })
  }
});

/*
========== PUT Requests ==========
*/

// Route to report a question, needs question_id
app.put('/api/fec2/hr-den/qa/questions/*/report', async (req, res) => {
  const question_id = req.url.replace('/api/fec2/hr-den/qa/questions/', '').replace('/report', '')
  await db.pool.query(`UPDATE questions SET reported = true WHERE id = ${question_id}`, (err, result) => {
    if (err) {
      res.send(err)
    } else {
      res.send()
    }
  })
})

// Route to report an answer, needs answer_id
app.put('/api/fec2/hr-den/qa/answers/*/report', async (req, res) => {
  const answer_id = req.url.replace('/api/fec2/hr-den/qa/answers/', '').replace('/report', '')
  await db.pool.query(`UPDATE answers SET reported = true WHERE id = ${answer_id}`, (err, result) => {
    if (err) {
      res.send(err)
    } else {
      res.send()
    }
  })
})

// Route to increment an answers helpfulness, needs answer_id
app.put('/api/fec2/hr-den/qa/answers/*/helpful', async (req, res) => {
  const answer_id = req.url.replace('/api/fec2/hr-den/qa/answers/', '').replace('/helpful', '')
  await db.pool.query(`UPDATE answers SET helpful = helpful + 1 WHERE id = ${answer_id}`, (err, result) => {
    if (err) {
      res.send(err)
    } else {
      res.send()
    }
  })
})

/*
========== GET Requests ==========
*/

app.get('/loaderio-8e50c51dc3e82b45629db7720d01fd44.txt', async (req, res) => {
  res.send('loaderio-8e50c51dc3e82b45629db7720d01fd44')
})

// Route to get all answers from a question, needs question_id
app.get('/api/fec2/hr-den/qa/questions/*/answers', async (req, res) => {
  const question_id = url.parse(req.url, false).pathname.replace('/api/fec2/hr-den/qa/questions/', '').replace('/answers', '')
  const params = url.parse(req.url, true).query
  if (params.count === undefined) {
    params.count = 5
  }
  params.page = params.page - 1 || 0

  const query = await db.pool.query(`
  SELECT
    answers.id as answer_id,
    body,
    date_written as date,
    answerer_name,
    helpful as helpfulness,
    ARRAY_REMOVE(ARRAY_AGG(url), NULL) photos
  FROM answers
  LEFT JOIN answers_photos ON answers.id = answers_photos.answer_id
  WHERE question_id = ${question_id} AND answers.reported = false
  GROUP BY answers.id
  ORDER BY helpful
  LIMIT ${params.count}`, (err, result) => {
    if (err) {
      res.send(err)
    } else {
      res.setHeader('Content-Type', 'application/json');
      const returnObj = {question: question_id, page: params.page, count: params.count, results: query.rows}
      res.send(returnObj)
    }
  })
})

// Route to get all questions from a product, needs product_id
app.get('/api/fec2/hr-den/qa/questions*', async (req, res) => {
  const params = url.parse(req.url, true).query
  params.count = params.count || 5
  params.page = params.page - 1 || 0

  await db.pool.query(`
  SELECT
  q.id,
  q.body,
  q.date_written,
  q.asker_name,
  q.helpful,
  q.reported, (
    select JSON_OBJECT_AGG(
      a.id, JSON_BUILD_OBJECT(
        'id', a.id,
        'body', a.body,
        'date', a.date_written,
        'answerer_name', a.answerer_name,
        'helpfulness', a.helpful,
        'photos', (
          SELECT coalesce(json_agg(answers_photos.url), '[]'::json)
          FROM answers_photos
          WHERE answers_photos.answer_id = a.id)
      )
    )
    FROM answers as a WHERE a.question_id = q.id
  ) as answers

  FROM questions as q
  WHERE q.product_id = ${params.product_id}
  ORDER BY q.helpful desc
  LIMIT ${params.count}
  OFFSET ${params.count * params.page}`, (err, result) => {
    const returnObj = {product_id: params.product_id, results: result.rows}
    if (err) {
      res.send()
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.send(returnObj)
    }
  })
})