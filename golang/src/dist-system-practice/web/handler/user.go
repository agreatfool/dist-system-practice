package handler

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func HandlePlanTask(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "Done",
	})
}
