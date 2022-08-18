const fetch = require('sync-fetch')
require('dotenv').config()
const logger = require('./log4js').log4js//logger
const fs = require('fs')
const numeral = require('numeral')

function getMessage(coin){
	let msg = ``
	let price = ``
	let maxTokens = ``
	let stakedTokens = ``
	let totalTokens = ``
	let stakedPercent = ``
	let totalPercent = ``
	let teamTokens = ``
	let communityTokens = ``
	let communityPercent = ``
		
	try {
		//no file = create
		let file = `./json/${coin}.json`
		let rJson = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : ''
		var wdate = fs.existsSync(file) ? parseInt(rJson.wdate) + (60 * 1000) : 0
		var cdate = parseInt(new Date().getTime())
		
		if(coin == 'evmos'){
			let evmosInfo = getEvmosInfo()
			msg = `☄️ <b>Evmos ($EVMOS)</b>\nㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ\n\n`
			if( wdate <  cdate) {
				price = getPrice()
				apr = getAPR()
				priceUsd = price[0].toFixed(2)
				priceKrw = price[1].toFixed(0)
				maxTokens = (evmosInfo.max_tokens/ 1000000000000000000).toFixed(0)
				stakedTokens = (evmosInfo.bonded_tokens / 1000000000000000000 ).toFixed(0)
				stakedPercent = (stakedTokens / maxTokens * 100).toFixed(0)
				notStakedTokens = maxTokens - stakedTokens
				notStakedPercent = (notStakedTokens / maxTokens * 100).toFixed(0)
				prvDetail = getProvalidatorDetail()//get provalidator detail info
				prvRank = prvDetail.rank
				prvRate = (prvDetail.rate * 100)
				prvTokens = (prvDetail.tokens/ 1000000000000000000).toFixed(0)
				
				let wJson = {
					"priceUsd" : priceUsd,
					"priceKrw" : priceKrw,
					"apr" : apr,	
					"maxTokens" : maxTokens,
					"stakedTokens" : stakedTokens,
					"stakedPercent" : stakedPercent,
					"notStakedTokens" : notStakedTokens,
					"notStakedPercent" : notStakedPercent,
					"prvRank" : prvRank,
					"prvTokens" : prvTokens,
					"prvRate" :  prvRate,
					"wdate" : new Date().getTime()
				}
				fs.writeFileSync(file, JSON.stringify(wJson))
			}else{
				priceUsd = rJson.priceUsd
				priceKrw = rJson.priceKrw
				apr = rJson.apr
				maxTokens = rJson.maxTokens
				stakedTokens = rJson.stakedTokens
				stakedPercent = rJson.stakedPercent
				notStakedTokens = rJson.notStakedTokens
				notStakedPercent = rJson.notStakedPercent
				prvRate = rJson.prvRate
				prvTokens = rJson.prvTokens
			}
			msg += `🥩<b>스테이킹</b>\n\n`
			msg += `💰<b>가격: $${priceUsd} (약 ${numberWithCommas(priceKrw)}원)</b>\n\n`
			msg += `<b>📈본딩 APR: ${apr}%</b>\n\n`
			msg += `<b>🔐본딩: ${stakedPercent}% / 🔓언본딩: ${notStakedPercent}%</b>\n\n`
			msg += `<b>⛓️최대공급량: ${numberWithCommas(maxTokens)} (100%)</b>\n\n`
			msg += `<b>프로밸리와 $EVMOS 스테이킹 하세요❤️</b>\n\n`
			msg += `<b>🏆검증인 순위: #${prvRank}</b>\n\n`
			msg += `<b>🔖수수료: ${prvRate}%</b>\n\n`
			msg += `<b>🤝위임량: ${numberWithCommas(prvTokens)}</b>\n\n`
			msg += `ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ\n`
			msg += `<b>프로밸리(<a href='https://provalidator.com' target='_blank'>Provalidator</a>) 검증인 만듦</b>\n`
		}	

		return msg
	}catch(err){
		logger.error(`=======================func error=======================`)
		logger.error(err)
		return null
	}
}

function getProposal(num){
	let title = ''
	let jsonLocal = getProposalFromLocal(num)
	//PROPOSAL_STATUS_DEPOSIT_PERIOD | PROPOSAL_STATUS_VOTING_PERIOD | PROPOSAL_STATUS_PASSED | PROPOSAL_STATUS_REJECTED
	if(jsonLocal === 0 || jsonLocal === false){//not found json file from local
		let jsonServer = getProposalFromServer(num) //get server data 
		if(jsonServer === 203){//not found
			return "Not found proposal #" + num
		} else if(jsonServer === 500 || jsonServer === false){//internal error
			return "Sorry! bot has error."
		}else{
			title = jsonServer.title
		}
	} else {
		//proposal is not fixed
		if(jsonLocal.status === "PROPOSAL_STATUS_PASSED" || jsonLocal.status === "PROPOSAL_STATUS_REJECTED"){
			title = jsonLocal.title
		} else{
			let jsonServer = getProposalFromServer(num) //get server data
			title = jsonServer.title
		}
	}
	let prvDetail = getProvalidatorDetail()//get provalidator detail info
	let prvRank = prvDetail.rank
	let prvRate = (prvDetail.rate * 100)
	let prvTokens = (prvDetail.tokens/ 1000000000000000000).toFixed(0)
	let msg = `<b>☄️ Evmos ($EVMOS) 거버넌스</b>\n` 
	msg += `ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ\n\n`
	msg += `<b>🗳️프로포절</b>\n\n`
	msg += `#${num} ${title}\n\n`
	msg += `📌<a href='https://www.mintscan.io/evmos/proposals/${num}'>https://www.mintscan.io/evmos/proposals/${num}</a>\n\n`
	msg += `🔍다른 프로포절 검색은 [/proposal 숫자]\n\n`
	msg += `<b>프로밸리와 $EVMOS 스테이킹 하세요❤</b>\n\n`
	msg += `<b>🏆검증인 순위: #${prvRank}</b>\n\n`
	msg += `<b>🔖수수료: ${prvRate}%</b>\n\n`
	msg += `<b>🤝위임량: ${numberWithCommas(prvTokens)}</b>\n\n`
	msg += `ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ\n`
	msg += `<b>프로밸리(<a href='https://provalidator.com'>Provalidator</a>) 검증인 만듦</b>`
	return msg
}

function getProposalFromServer(num){ //write Proposal json
	let json = fetch(process.env.EVMOS_API_URL+"/gov/proposal/"+num).json()
	let file = './json/proposals/' + num + '.json'
	let wJson = {}
	//logger.info(json)
	
	try{
		if(typeof json.proposal_id !== "undefined"){
			wJson = {
				"id" : json.proposal_id, 
				"title" : json.title, 
				"desc" : json.description, 
				"status" : json.proposal_status
			}
			fs.writeFileSync(file, JSON.stringify(wJson))
			return wJson
		} else{
			//203 not found , 500 error
			return json.error_code
		}		
	}catch(err){
		logger.error(`=======================getProposalFromServer error=======================`)
		logger.error(json)
		return false
	}
}

function getProposalFromLocal(num){//read Proposal json
	let file = './json/proposals/' + num + '.json'
	try{
		if(fs.existsSync(file)){
			return JSON.parse(fs.readFileSync(file))
		} else {
			return 0
		}
	} catch(err){
		logger.error(`=======================getProposalFromJson error=======================`)
		logger.error(json)
		return false
	}
}

function getLatestProposalNum(){
	let latestProposal = 0
	
	try{
		var files = fs.readdirSync('./json/proposals')
		var fileArr = []
		for(var i = 0; i < files.length; i++){			
			fileArr.push(parseInt(files[i].replace(/\.[^/.]+$/, "")))
		}
		latestProposal = (Math.max(...fileArr))
		return latestProposal
	} catch(err){
		return 0
	}
}

function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
function getAPR(){
	let aprTxt = fetch('https://evmos.api.explorers.guru/api/bank/apr').text()
	let apr = (aprTxt *100).toFixed(2)
	//console.log(apr)
	return apr	
}
function getPrice(){
	let json = fetch('https://api.coingecko.com/api/v3/simple/price?ids=evmos&vs_currencies=usd,krw').json()
	return [json.evmos.usd,json.evmos.krw]
}
function getEvmosInfo(){
	//https://lcd-evmos.keplr.app/bank/total/aevmos
	//https://lcd-evmos.keplr.app/staking/pool
	let json = fetch(process.env.EVMOS_API_URL+"/bank/total/aevmos").json()
	let maxTokens =json.result.amount
	
	let json2 = fetch(process.env.EVMOS_API_URL+"/staking/pool").json()
	let bondedTokens = json2.result.bonded_tokens
	let notBondedTokens = json2.result.not_bonded_tokens
	
	let returnArr = { 
		'bonded_tokens' : bondedTokens,
		'not_bonded_tokens' : notBondedTokens,
		'max_tokens' : maxTokens
	}
	
	return returnArr	
}

function bak_getEvmosInfo(){
	let json = fetch(process.env.EVMOS_API_URL+"/status").json()
	//console.log(json)
	let returnArr = { 
		'bonded_tokens' : json.bonded_tokens,
		'not_bonded_tokens' : json.not_bonded_tokens,
		'max_tokens' :''
	}
	
	for(var j in json.total_circulating_tokens.supply){
		if(json.total_circulating_tokens.supply[j].denom == 'aevmos'){
			returnArr.max_tokens = json.total_circulating_tokens.supply[j].amount
			break
		}
	}
	return returnArr	
}
function getProvalidatorDetail(){
	let json = fetch(process.env.EVMOS_API_URL2+"/validators").json()
	let obj = {};
	for(var i in json){
		if(process.env.PROVALIDATOR_OPERATER_ADDRESS === json[i].operator_address){			
			obj.rank = json[i].rank
			obj.rate = json[i].commission
			obj.tokens = json[i].tokens
		}
	}
	return obj	
}

module.exports = {
	getMessage : getMessage,
	getProvalidatorDetail : getProvalidatorDetail,
	getProposal : getProposal,
	getProposalFromServer : getProposalFromServer,
	getProposalFromLocal : getProposalFromLocal,
	getLatestProposalNum : getLatestProposalNum
}