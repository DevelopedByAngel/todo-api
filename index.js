
const express=require('express');
const app=express();
const cors=require('cors');
const bodyParser=require('body-parser');
const knex=require('knex');
const jwt=require('jsonwebtoken');
const https=require('https');
const http=require('http');
const nodemailer=require('nodemailer');
const dateformat=require('dateformat');
const database=knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'angel@111@ps',
    database : 'spindle'
  }
});
var mailtransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'remainderevent@gmail.com',
    pass: 'remainder111'
  }
});
app.use(bodyParser.json());
app.use(cors());
app.get('/',(req,res)=>
	{
		database.select('*').from('users')
		.then(user=>res.send(user));
	});
app.post('/login',(req,res)=>
	{
		const {email,password} = req.body;
		console.log('in'+email,password)
		database.select('*').from('logind').where('email','=',email)
		.then(data=>
			{
				console.log(data)
				const valid=password===jwt.verify(data[0].name,'spindle').password;
				console.log(valid)
				if (valid)
				{
					database.select('*').from('users').where('email','=',email)
					.then(user=>
					{	console.log(user)
						res.send(user[0]);					
					})
				}
				else
				{
					rs.status(402).json('wrong password');
				}
			})
		.catch(err=>res.status(400).json('error occured'))		
	});
app.post('/register', (req, res)=>
	{
		const {name,email,password} = req.body;
		const hash=jwt.sign({password:password},'spindle');
		database.transaction(trx=>
		{
		trx('logind')
		.insert(
		{
			name: hash,
			email: email
		})
		.returning('email')
		.then(loginemail=>
		{
			console.log('registerd with '+loginemail[0])
			return trx('users')
			.insert(
			{
				name:name,
				email:loginemail[0]
			})
			.returning('*')
			.then(user=>
			{
				console.log('logged in as '+user[0].name)
				if(user[0])
				{
					database.select('*').from('users').where('email','=',user[0].email)
					.then(usergot=>
					{
						// createTable(usergot[0].id)
						var id=usergot[0].id;
						const tablename='user'+id;
		database.select('*').from('users').where('id','=',parseInt(id))
		.then(user=>
		{
			if(user)
			{
				database.schema.createTable(tablename,(table)=>
				{
					table.increments('id');
					table.string('task');
					table.date('due');
				})
				.then(console.log('table created for'+user[0].name))
				.catch(err=>console.log(err))
			}
		})
					})
					.catch(err=>Error('error'))
					res.json(user[0])
				}
			})
			.catch(err =>Error('error'))
		})
		.then(trx.commit)
		.catch(trx.rollback);
	})
		.catch(err=>res.status(400).json(err))
	});
const createTable=(id)=>
	{
		const tablename='user'+id;
		database.select('*').from('users').where('id','=',parseInt(id))
		.then(user=>
		{
			if(user)
			{
				database.schema.createTable(tablename,(table)=>
				{
					table.increments('id');
					table.string('task');
					table.date('due');
				})
				.then(console.log('table created for'+user[0].name))
				.catch(err=>console.log(err))
			}
		})
	}
app.post('/add',(req,res)=>
	{
		const {id,task,due}=req.body;
		const tablename='user'+id;
		database.insert(
		{
			task:task,
			due:due
		})
		.returning('*')
		.into(tablename)
		.then(taskentered=>
			{
				if(taskentered)
					getTasks(id,res);
			})
		.catch(err=>console.log(err))
	});
const getTasks=(id,res)=>
{
	var tasks;
	database.select('*').from('user'+id)
	.then(task=>
	{
		console.log(task)
		res.json(task);
	})
}
app.post('/tasks',(req,res)=>
	{
		const id = req.body.id;
		console.log(id);
		getTasks(id,res);
	});
app.post('/delete',(req,res)=>
	{
		const {id,taskid}=req.body;
		database('user'+id).where('id','=',taskid)
		.del()
		.then(()=>
		{
			getTasks(id,res)
		})
	});
app.post('/update',(req,res)=>
	{
		const {id,taskid,task}=req.body;
		database('user'+id)
		  .where({ id: taskid })
		  .update({ task: task }, ['id', 'task'])
		  .then(()=>
		{
			getTasks(id,res)
		})
	});
database.select('*').from('users')
.then(users=>
	{
		var users=users;
		users.map(user=>
	{
		database.select('*').from('user'+user.id)
		.then(tasks=>
		{
			tasks.map(task=>
			{
	
				if(task.due.toString().slice(0,15)==dateformat(new Date()).slice(0,15))
				{
					mail(task.task,user.email);
				}
			})
		})
	})
	})
const mail=(task,mail)=>
{
	// console.log('mailed');
	// var mailOptions = {
	//   from: 'remainderevent@gmail.com',
	//   to: mail,
	//   subject:"Remainder : "+task,
	//   html:  '<p> Today is the due date for <strong> "'+task+'" </strong>.Hope this remainder was helpful.<p><br><br><p>Add your tasks and due date <a href="#">here</a> to keep you remainded</p>'
	// };

	// mailtransport.sendMail(mailOptions, function(error, info){
	//   if (error) {
	//     console.log(error);
	//   } else {
	//     console.log('Email sent: ' + info.response);
	//   }
	// });
	console.log(mail+" sent for "+task)
}
app.listen(3000);