package logger

import (
	"dist-system-practice/lib/common"
	"fmt"
	"go.uber.org/zap"
	"gopkg.in/yaml.v2"
	"io/ioutil"
	"path/filepath"
)

var instance *zap.Logger

// Get the global zap.logger.
//
// Actually: zap.L()
func Get() *zap.Logger {
	return instance
}

// Create a new zap.logger & replace the global one.
//
// Env LOGGER_CONF_PATH is used to specify the config file path.
// Env APP_NAME is used to specify the key part of config file name.
func New() *zap.Logger {
	if instance != nil {
		return instance
	}

	config := zap.Config{}

	// get config path string
	confPath := common.GetEnv("LOGGER_CONF_PATH", "")
	if confPath == "" {
		panic("[Logger] No conf path provided: LOGGER_CONF_PATH")
	}

	// read config into string
	conf, ioErr := ioutil.ReadFile(confPath)
	if ioErr != nil {
		panic(fmt.Sprintf("[Logger] Failed to read conf file: %s", ioErr.Error()))
	}

	// parse config yaml
	// available options: https://github.com/uber-go/zap/blob/master/config.go#L53
	if err := yaml.Unmarshal(conf, &config); err != nil {
		panic(fmt.Sprintf("[Logger] Failed to parse yaml: %s", err.Error()))
	}

	// adjust output name with ENV
	appName := common.GetEnv("APP_NAME", "")
	if appName != "" {
		for index, outputPath := range config.OutputPaths {
			if outputPath == "stdout" {
				continue
			}
			outputTarget := filepath.Join(
				filepath.Dir(outputPath),
				"app",
				fmt.Sprintf("%s.stdout.log", appName))
			if err := common.FileEnsure(outputTarget); err != nil {
				panic(fmt.Sprintf("[Logger] Failed to create log file: %s, err: %s", outputTarget, err.Error()))
			}
			config.OutputPaths[index] = outputTarget
		}
		for index, errPath := range config.ErrorOutputPaths {
			if errPath == "stderr" {
				continue
			}
			outputTarget := filepath.Join(
				filepath.Dir(errPath),
				"app",
				fmt.Sprintf("%s.stderr.log", appName))
			if err := common.FileEnsure(outputTarget); err != nil {
				panic(fmt.Sprintf("[Logger] Failed to create log file: %s, err: %s", outputTarget, err.Error()))
			}
			config.ErrorOutputPaths[index] = outputTarget
		}
	}

	// build logger from config
	logger, instanceErr := config.Build()
	if instanceErr != nil {
		panic(fmt.Sprintf("[Logger] Cannot init zap logger: %s", instanceErr.Error()))
	}

	// replace global logger singleton
	zap.ReplaceGlobals(logger)

	instance = zap.L()

	return instance
}
