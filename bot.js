import { Telegraf,session  }  from 'telegraf';
import axios  from 'axios';
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
dotenv.config();
import monthModel from './database.js';

const app = express();
const port = process.env.PORT || 3000;

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());

let money = 2000 ; 

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

let getMonth = () => {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const ind = new Date().getMonth();
    const currentMonth = monthNames[ind] + ' ' + new Date().getFullYear();
    return currentMonth;
}

bot.command('start', (ctx) => {
    ctx.reply('Hello I am your bot. I can help you manage your expenses. \nType /show to see the total expense for the month. \nType /add to add an expense. \nType /showDetail to see the details of the expenses for the month.');
});



bot.command('add', async(ctx) =>{
    const [name, amount] = ctx.message.text.split(' ').slice(1);
    const date = new Date().toDateString();

    const currentMonth = getMonth();
    
    const existingMonth = await monthModel.findOne({ name: currentMonth });
    
    if ((!name) || (!amount)) {
        ctx.reply('Please provide both name and amount.');
        return;
    }
    if (existingMonth && name && amount ) {
        existingMonth.expense.push({ name, amount, date });
        
        await existingMonth.save();
    } else {
        const newMonth = new monthModel({ name: currentMonth,budget:money, expense: [{ name, amount, date }] });
        await newMonth.save();
    }

    ctx.reply(`Adding ${amount} to ${name}`);
})
bot.catch((err, ctx) => {
    console.log(`Error occurred for ${ctx.updateType}`,err);
    ctx.reply('Oops, something went wrong. Please try again later.');
});



bot.command('showDetail', async (ctx) => {
    
    ctx.session = ctx.session || {};
    ctx.reply('Enter the month : ');
    ctx.session.waitingForMonthDetail = true;
});


bot.command('show', (ctx) => {
    ctx.reply('Enter the month');

    ctx.session = ctx.session || {};

    ctx.session.waitingForMonth = true;
});

bot.command('setBudget', async(ctx)=>{
    const [budget] = ctx.message.text.split(' ').slice(1);
    money = budget;
    const currentMonth = getMonth();
    
    const existingMonth = await monthModel.findOne({ name: currentMonth });


    if (existingMonth) {
        existingMonth.budget = budget;
        await existingMonth.save();
        
    } else {
        const newMonth = new monthModel({ name: currentMonth,budget:money, expense: [] });
        await newMonth.save();
    }

});


bot.command('remainingBudget',async(ctx)=>{
    const currentMonth = getMonth();
    const existingMonth = await monthModel.findOne({ name: currentMonth });
    const currentExpense = await CalculateExpense(currentMonth);
    const remaining = existingMonth.budget - currentExpense;

    ctx.reply('Remaining budget for the month is : ' + remaining);
});

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

app.get('/', (req, res) => {
    res.send('Bot is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});