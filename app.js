const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/players/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

app.get('/players/', async (request, response) => {
  const getplayersQuery = `
    SELECT
      *
    FROM
      player_details
    ORDER BY
      player_id;`
  const playersArray = await db.all(getplayersQuery)
  response.send(playersArray)
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getplayersQuery = `
    SELECT
      *
    FROM
      player_details
    WHERE
      player_id = ${playerId};`
  const player = await db.get(getplayersQuery)
  response.send(player)
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const updateplayerkQuery = `
  UPDATE  
    player_details
  SET
    player_name = '${playerName}'
  WHERE player_id = ${playerId}; `
  await db.run(updateplayerkQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getmatchQuery = `
    SELECT
      *
    FROM
      match_details
    WHERE
      match_id = ${matchId};`
  const match = await db.get(getmatchQuery)
  response.send(match)
})
const convertDbObjectToResponseObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    playerName: dbObject.player_name,
    match: dbObject.match,
    year: dbObject.year,
  }
}

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getplayersQuery = `
    SELECT
      *
    FROM
      player_match_score
      NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`
  const player = await db.all(getplayersQuery)
  response.send(
    player.map(eachmatch => convertDbObjectToResponseObject(eachmatch)),
  )
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getmatchesQuery = `
    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	  FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`
  const players = await db.all(getmatchesQuery)
  response.send(players)
})

app.get('/players/:playerId/playerscores', async (request, response) => {
  const {playerId} = request.params
  const getplayersQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes 
    FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `
  const player = await db.all(getplayersQuery)
  response.send(player)
})

module.exports = app
