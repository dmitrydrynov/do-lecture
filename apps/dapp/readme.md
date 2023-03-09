You can create a cron.log file to contain just the CRON entries that show up in syslog. Note that CRON jobs will still show up in syslog if you follow the following directions.

Open the file

/etc/rsyslog.d/50-default.conf
Find the line that starts with:

#cron.*
uncomment that line, save the file, and restart rsyslog:

sudo service rsyslog restart
You should now see a cron log file here:

/var/log/cron.log
Cron activity will now be logged to this file (in addition to syslog).

Sometimes it can be useful to continuously monitor it, in that case:
tail -f /var/log/syslog | grep CRON
tail -f /var/log/cron
or
journalctl -t CRON


curl -X POST --url 'http://localhost:3000/api/cron' -H 'Authorization: Bearer SwBe7gvLrIGkkIwN03XIIz1+TVYMPQlDwdNJLLZUHXM=' > /var/log/cron 2>&1

start service
sudo service cron start
stop service
sudo service cron start