import { Telegraf,session  }  from 'telegraf';
import axios  from 'axios';
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
import monthModel from './database.js';



const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());

let CalculateExpense = async (month) => {
    const monthData = await monthModel.findOne({ name: month });
    if (!monthData) {
        return 'No data found for the month';
    }   
    else {
        let total = 0 ;
        monthData.expense.forEach((expense) => {
            total += expense.amount;
        });
        // console.log("calculateing")
        // console.log(total)
        return total; 
    }
;}

let CalculateExpenseDetail = async (month) => {
    const monthData = await monthModel.findOne({ name: month });
    if (!monthData) {
        return 'No data found for the month';
    }   
    else {
        let response = '';
        monthData.expense.forEach((expense) => {
            response += `Name : ${ expense.name}, Amount : ${ expense.amount}, Date : ${ expense.date}\n`;
        });
        return response;
    }
}


bot.command('start', (ctx) => {
    ctx.reply('Here we go');
});

bot.command('add', async(ctx) =>{
    const [name, amount] = ctx.message.text.split(' ').slice(1);
    const date = new Date().toDateString();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const ind = new Date().getMonth();
    const currentMonth = monthNames[ind] + ' ' + new Date().getFullYear();
    const existingMonth = await monthModel.findOne({ name: currentMonth });
    // console.log(name)
    if ((!name) || (!amount)) {
        ctx.reply('Please provide both name and amount.');
        return;
    }
    if (existingMonth && name && amount ) {
        existingMonth.expense.push({ name, amount, date });
        // console.log('exist');
        await existingMonth.save();
    } else {
        const newMonth = new monthModel({ name: currentMonth, expense: [{ name, amount, date }] });
        await newMonth.save();
    }

    ctx.reply(`Adding ${amount} to ${name}`);
})
bot.catch((err, ctx) => {
    console.log(`Error occurred for ${ctx.updateType}`,err);
    ctx.reply('Oops, something went wrong. Please try again later.');
});


bot.command('showDetail', async (ctx) => {
    // console.log('ansh command received');
    ctx.session = ctx.session || {};
    ctx.reply('Enter the month : ');
    ctx.session.waitingForMonthDetail = true;
});


bot.command('show', (ctx) => {
    ctx.reply('Enter the month');

    ctx.session = ctx.session || {};

    ctx.session.waitingForMonth = true;
});

// bot.command('add', async(ctx) =>{
bot.hears(/.*/, async(ctx) => {

    ctx.session = ctx.session || {};
    try {
        if (ctx.session.waitingForMonth) {
            const month = ctx.message.text; 
            // ctx.reply(`You entered: ${month}`);
            ctx.session.month = month;
            
            const monthData =await CalculateExpense(month);

            ctx.reply('Total expense for the month is: ' + monthData);

            ctx.session.waitingForMonth = false;
        }
        else if(ctx.session.waitingForMonthDetail){
            const month = ctx.message.text ;
            ctx.session.waitingForMonthDetail = false;
            // ctx.reply(month);
            const monthData =await CalculateExpenseDetail(month);

            ctx.reply('Expense details for the month are: \n' + monthData);
        }
    } catch (error) {

        console.error('Error handling the message:', error);
        ctx.reply('An error occurred. Please try again.');
    }
});



bot.launch().catch((err)=>{
    console.log("error happened");
});