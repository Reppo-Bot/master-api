import requests as r

TEST_URL = "http://test.localhost:8080"

def testDiscordCommandsCall():
    res = r.post(f"{TEST_URL}/testDiscordCommandsCall")
    _res = res.json()
    if("failed" in _res):
        print(_res['failed'])
    else:
        print(_res['success'])

if __name__ == '__main__':
    testDiscordCommandsCall()
