# CS3733 Team Rana
Nick Benoit, Eamon Oldridge, Nathan Rosenberg, and Yil Verdeja

## Rana-Scheduler
The [Rana-Scheduler](http://rana-scheduler.s3-website.us-east-2.amazonaws.com/) website uses one page for all its views. There are two major views:
 - The main page is the create schedule view, which is also the landing page for our site
 - The review schedule view is the secondary view, which is determined by a schedule ID query

This is an example link that **will not work** where "scheduleID" is a number that represents an actual scheduleID
http://rana-scheduler.s3-website.us-east-2.amazonaws.com/?scheduleID

### Create Schedule
In the create schedule view, an Organizer must enter the following information to proceed:
1. A schedule name
2. A start and end date
3. A start and end time
4. A timeslot duration
5. A username and email

Once they have entered the information and submitted it, the service will present a notification that the operation has succeeded or failed. After successfully creating a schedule, the link is changed to reflect the unique ID of the newly created schedule. As shown in the example above, it appends a scheduleID to the end of the main link. The 'Organizer's Review' view is then entered.

### Review Schedule
By sharing the link provided after creating a schedule (*see example link above*), anyone with the link can enter and view the schedule.

On the left, the viewer will see the schedule. On the top of the schedule is the week of the schedule being viewed. If the schedule is longer than one week, a viewer can move through different weeks using the *left* (<) and *right* (>) buttons. The schedule contains timeslots ranging from 10 minutes to 60 minutes, each with a status indicated by a different color: 
 - Green slots are open slots, where Participants can schedule meetings
 - Grey slots are closed slots, which are not open for meetings

On the right, the viewer will see multiple user options, including options to sign in as a Participant or Organizer. A user initially enters as a Participant.

Instead of refreshing the page, a user can click the *refresh schedule* button to refresh the schedule.

#### Organizer
An Organizer can enter the Organizer view by using their secret code. It is also the view that is entered upon the successful creation of a schedule. The Organizer view contains an additional yellow slot color, indicating a slot that a Participant has scheduled a meeting in. It also contains the user's name. These slots will be colored grey in the Participant view, as it is not important for Participants to know who has scheduled meetings when.

By clicking on an open slot or closed slot, the organizer can toggle their availability at that time. The Organizer can also change the availability of all time slots on a given day, or all time slots at a certain time, by clicking on that day or time in the view and deciding whether to "open" or "close" slots under the *Toggle Day and Times* section.

Additionally, an organizer has the ability to extend the start and end dates of the schedule. Dates can only be extended and can only be during the weekdays. Once complete, the schedule is updated to reflect change.

The Organizer can cancel meetings that have been created by Participants by clicking on a meeting. The organizer will be prompted to confirm that they want to cancel the meeting. After getting confirmation, the meeting will be deleted and the schedule will be updated to reflect the change.

Finally, an organizer can also delete their own schedule. They will be prompted of the deletion, and if confirmed, they will be taken back to the main page.

#### Participant
A Participant can create a meeting in any open time slot during a schedule that has been shared with them. To do so, they must enter their user details, which includes a username and email to identify them. After selecting a time slot on the schedule, and successfully creating a meeting, they will be provided a secret code to access their meeting and cancel it if they desire to at a later date.

A Participant also has the ability to search for a specific timeslot by providing a year, month, weekday, date, and/or hour. After submitting the query, they will be provided with possible timeslots that fit within their requirements.

A returning participant can view their meeting and cancel it if they enter their secret code in the login area.

### SysAdmin Page
Once entering the [SysAdmin](http://rana-scheduler.s3-website.us-east-2.amazonaws.com/?sysadmin) page, the user will be prompted to enter the secret code (pJRQYrSEvm) in order to access administrative details. The SysAdmin has the ability to review schedules created within a requested number of hours, or delete schedules older than an a requested date.

## Step Summary
Organizer:
1. Enter main site
2. Create schedule and save secret code
3. Edit schedule if necessary by entering secret code
4. Copy link and share to participants

Participant:
1. Enter schedule review via link provided by organizer
2. Create meeting and save secret code
3. View meeting and/or cancel meeting by entering secret code

SysAdmin:
1. Enter SysAdmin page with password
2. Review system usage or delete old schedules
