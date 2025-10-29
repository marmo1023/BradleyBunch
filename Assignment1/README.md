Group Project:

The game seeks to simulate guessing how to invest in the stock market by looking at prior totals. The game needs the following features:
  Prompt the user to enter a ticker symbol.
  Start with $10,000 in a bank account.
  Start the game on a random day, at least six months old. Obtain the ticket symbol price for that day. (Don't tell the user the day.)
  Ask the user if to buy, sell, hold, or quit.
    Upon sell, allow the user to select how much of their owned stock to sell. Investment income is stored in the bank account. 
    Upon buy, use funds in the bank account to purchase stock. The user selects how much to purchase. Those funds go to the investment account.
    Upon hold, no buy or sell occurs that day.
  Progress to the next day. Use historical data to obtain the ticker symbol's price for the next data point. Display changes to the investment account.
  Let the program commence for at least 7 days.
  When the user selects to quit, all funds are sold from the investment account and put into the bank account.
  Display the overall gain or loss, and the elapsed time period. 

This program has two fundamental requirements for the user interface:
  The program must use asynchronous communication. The program cannot forward or redirect to a new URL once the ticker symbol is entered.
  The program also can't reload the same URL (causing a flicker). Instead, all data must be sent to and from the server asynchronously 
  so that the screen doesn't flicker. Upon buy or sell, the user needs three different UI options to enter the data. One example 
  should be a simple textbox where the user can type in an amount. Another should be a visual chart (such as a pie chart, which the user can drag). 
  A third can be a slider. If you have another UI idea beyond these, just check with me. I am only interested in the total of three distinct 
  ways. Additionally, when one is modified by the user, the other two must also be modified in real time. So, for example, if the user 
  interface has a textbox, a pie chart, and a slider, and the user uses the slider to buy the investment from the bank account, then the textbox
  should update with the new potential value, and the pie chart should be modified with the new potential value. 
The server is responsible for obtaining the ticker prices and sending them to the client. The JavaScript code running in the browser cannot
Obtain that data from the ticker prices directly from the source.

A user login is not needed for this assignment. A database is also not needed for this assignment. You may choose to simply download all prices 
for all ticker symbols and store them in a database if that is easier. If you cannot find any daily ticker prices, you can switch to weekly or
monthly if needed, just adjust your program accordingly, and let me know.
