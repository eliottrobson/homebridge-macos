# Homebridge MacOS
Homebridge plugin to track Mac OS events (screen on / off)

# Installation

Install the plugin
```
npm i homebridge-macos
```

Configure in homebridge config
```
{
    "platform": "homebridge-macos.MacOS",
    "name": "Eliott's iMac",
    "poll": 3000
}
```


# Debugging
```
DEBUG=* /usr/local/bin/homebridge -D -U ~/Documents/Homebridge/homebridge-dev -P ~/Documents/Source/homebridge-macos
```

# Config
Variable | Description
-------- | -----------
`name` | This will be the name of this sensor, is is required and must be unique.
`poll` | (Optional) This is the amount of time to poll for in milliseconds (default: 5000)