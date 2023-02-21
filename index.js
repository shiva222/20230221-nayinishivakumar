const { response } = require('express');
const express = require('express');
const { get } = require('express/lib/response');
const  jsonAggregate  = require('json-aggregate')
const app = express();
const { MongoClient } = require('mongodb');
const url = 'mongodb://localhost:27017/';
const client = new MongoClient(url);
const database = 'BMI-table';

const port = 4000;
const dataTable =[{"Gender": "Male", "HeightCm": 171, "WeightKg": 96 }, {"Gender": "Male", "HeightCm": 161,
"WeightKg":85 }, { "Gender": "Male", "HeightCm": 180, "WeightKg": 77 }, { "Gender": "Female",
"HeightCm": 166,"WeightKg": 62}, {"Gender": "Female", "HeightCm": 150, "WeightKg": 70},
{"Gender": "Female","HeightCm": 167, "WeightKg": 82}];

app.get('/', async(req, res) => {
    await getData().then((resp)=>{
        console.log(resp);
        res.send(resp);
    })
});
let query = [
    {
        $addFields : { "HeightMts" : { $divide : [ "$HeightCm" , 100 ] } }
    },
    {
        $addFields : {
            "BMI" : { 
            $round : [ 
                { 
                    $divide : [ 
                        "$WeightKg" ,{ 
                            $multiply: [ 
                                "$HeightMts", 
                                "$HeightMts" 
                            ] 
                        } 
                    ]
                }, 1]
             }
        }
    },
    {
        $project : {
            "Gender" : 1,
            "HeightCm" : 1,
            "WeightKg" : 1,
            "BMI" : 1,
            "BmiCategory" : { 
                $switch : {
                    branches : [
                        {
                            case : {  $lte : [ "$BMI", 18.4 ] }, 
                            then : "Underweight"
                        },
                        {
                            case : { $and : [ 
                                { $gte : [ "$BMI", 18.5 ] },
                                { $lte : [ "$BMI", 24.9 ] }
                            ]},
                            then : "Normal weight"
                        },
                        {
                            case : { $and : [ 
                                { $gte : [ "$BMI", 25 ] },
                                { $lte : [ "$BMI", 29.9 ] }
                            ]},
                            then : "Overweight"
                        },
                        {
                            case : { $and : [ 
                                { $gte : [ "$BMI", 30 ] },
                                { $lte : [ "$BMI", 34.9 ] }
                            ]},
                            then : "Moderately obese"
                        },
                        {
                            case : { $and : [ 
                                { $gte : [ "$BMI", 35 ] },
                                { $lte : [ "$BMI", 39.9 ] }
                            ]},
                            then : "Severely obese"
                        }
                    ],
                    default: "Very severely obese"
                }
            },
            "healthRisk" : { 
                $switch : {
                    branches : [
                        {
                            case : {  $lt : [ "$BMI", 18.4 ] }, 
                            then : "Malnutrition risk"
                        },
                        {
                            case : { $and : [ 
                                { $gte : [ "$BMI", 18.5 ] },
                                { $lte : [ "$BMI", 24.9 ] }
                            ]},
                            then : "Low risk"
                        },
                        {
                            case : { $and : [ 
                                { $gte : [ "$BMI", 25 ] },
                                { $lte : [ "$BMI", 29.9 ] }
                            ]},
                            then : "Enhanced risk"
                        },
                        {
                            case : { $and : [ 
                                { $gte : [ "$BMI", 30 ] },
                                { $lte : [ "$BMI", 34.9 ] }
                            ]},
                            then : "Medium risk"
                        },
                        {
                            case : { $and : [ 
                                { $gte : [ "$BMI", 35 ] },
                                { $lte : [ "$BMI", 39.9 ] }
                            ]},
                            then : "High risk"
                        }
                    ],
                    default: "Very high risk"
                }
            }
        }
    }
];
async function getData() {
    var data = [];
    let result = await client.connect();
    let db = result.db(database);
    let collection = db.collection('bmi');
    let filteredData = collection.aggregate(query).toArray();
    data = await filteredData.then(res=>{ return JSON.stringify(res)});
    return data;
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});