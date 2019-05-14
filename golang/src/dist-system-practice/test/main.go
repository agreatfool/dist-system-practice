package main

import (
	"dist-system-practice/lib/cache"
	dao2 "dist-system-practice/lib/dao"
	"dist-system-practice/lib/database"
	"dist-system-practice/lib/logger"
	"log"
)

func main() {
	cache.New()
	logger.New()
	db := database.New()
	defer db.Close()
	dao := dao2.New()

	for i := 1; i <= 2; i++ {
		work, err := dao.GetWork(uint32(i))
		if err != nil {
			log.Println(err)
		}
		log.Printf("%v\n", work)
	}
}
