const { exec } = require('child_process');

let Accessory, Characteristic, Service, UUIDGen;

const pluginName = "homebridge-macos";
const platformName = "MacOS";

module.exports = function(homebridge) {
	Accessory = homebridge.platformAccessory;
    Characteristic = homebridge.hap.Characteristic;
    Service = homebridge.hap.Service;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform(pluginName, platformName, MacOS, true);
};

function MacOS(log, config, api) {
	if (!config) {
        log.warn("Ignoring homebridge-macos because it is not configured");
        this.disabled = true;
        return;
	}
	
	// Setup dependencies
	this.log = log;
	this.api = api;
	this.accessories = {};
	this.sensor = {
		name: config["name"]
	};
	this.poll = config["poll"] || 5000;

	const self = this;

	// Homebridge has finished loading cached accessories
	this.api.on("didFinishLaunching", function() {
		var uuid = UUIDGen.generate(self.sensor.name);

		if (!self.accessories[uuid])  {
            self.log("Adding '" + self.sensor.name + "' sensor.");

            // Create the accessory for the occupancy sensor
            var accessory = new Accessory(self.sensor.name, uuid);
            var service = accessory.addService(Service.OccupancySensor, self.sensor.name);
            
            self.accessories[uuid] = accessory;
            self.sensor.accessory = accessory;
            self.sensor.service = service;
            
            // Register the accessory with Homebridge
            self.api.registerPlatformAccessories(pluginName, platformName, [ accessory ]);
        }

        // Add information to the new accessory
        var informationService = self.sensor.accessory.getService(Service.AccessoryInformation);

        informationService
          .setCharacteristic(Characteristic.Manufacturer, "Homebridge Sensors for MacOS")
          .setCharacteristic(Characteristic.Model, "MacOS Sensor")
          .setCharacteristic(Characteristic.SerialNumber, self.sensor.name);

        self.sensor.state = null;
        self.appBeginListening();
	});
}

// Invoked when homebridge tries to restore cached accessory
MacOS.prototype.configureAccessory = function(accessory) {
    this.log("Configuring '" + accessory.displayName + "' sensor.");
    this.accessories[accessory.UUID] = accessory;

    this.sensor.accessory = accessory;
    this.sensor.service = accessory.services[1];
    this.sensor.state = null;
}

MacOS.prototype.appBeginListening = function() {
	// Check the screen status every 5 seconds
	this.appCheckScreen();
	setInterval(this.appCheckScreen.bind(this), this.poll);
}

MacOS.prototype.appCheckScreen = function() {
	const self = this;

	// If the sensor has been setup
	if (this.sensor.hasOwnProperty("state")) {
		exec("ioreg -n IODisplayWrangler | grep -i IOPowerManagement", function(err, stdout, stderr) {
			if (err) return;

			var expression = /"CurrentPowerState"=(.*)[,}]/g
			var state = expression.exec(stdout)[1] === "4"; // 4 = screen on

			if (state !== self.sensor.state) {
				self.log("Updating screen on state: " + (state ? "ON" : "OFF"));
				self.sensor.service.getCharacteristic(Characteristic.OccupancyDetected).updateValue(state);
				self.sensor.state = state;
			}
		});
	}
	
}