const express=require('express');
const app=express();
const cors=require('cors');
const bodyParser=require('body-parser');
const knex=require('knex')
const database=knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'angel@111@ps',
    database : 'spindle'
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
		var exists=false;
		database.select('*').from('login').where('hash','=',email)
		.then(data=>
			{
				console.log(data)
				const valid=password===data[0].email;
				console.log(valid)
				if (valid)
				{
					database.select('*').from('users').where('email','=',email)
					.then(user=>
					{	console.log(user)
						exists=true;
						res.json(user[0]);					
					});
				}
				else
				{
					res.json('wrong password');
				}
			})
		.catch(err=>res.status(400).json('unable to signin'))
		
	});
app.post('/register', (req, res)=>
	{
		const {name,email,password} = req.body;
		database.transaction(t=>
		{
			t.insert(
			{
				hash:password,
				email:email,
			})
			.into('login')
			.returning('email')
			.then(email=>
			{
				console.log('login')
				return t
				.insert(
				{
					name:name,
					email:email[0]
				})
				.into('users')
				.returning('*')
				.then(user=>
				{
					console.log('user')
					if(user)
						res.json(user[0]);
				})

			})
			.then(t.commit)
			.catch(err=>t.rollback)
		})
		.catch(err=>res.json(err))
	});

app.listen(3000,()=>
	{ console.log('ok')});