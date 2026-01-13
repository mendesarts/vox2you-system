import sys
try:
    import pdfplumber
    
    with pdfplumber.open('contas.pdf') as pdf:
        print('--- PDF CONTENT START ---')
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                print(text)
        print('--- PDF CONTENT END ---')
except ImportError:
    print('pdfplumber not installed. Installing...')
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pdfplumber'])
    print('Please run this script again.')
except Exception as e:
    print(f'Error: {e}')
